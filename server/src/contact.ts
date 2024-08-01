import Router = require("koa-router");
import { emitEvent, httpAuth } from "./authorization";
import { requestBodyContentType } from "./utils";
import { getPool } from "./database";
import { Context } from "koa";
import {
  QueryArrayConfig,
  QueryArrayResult,
  QueryConfig,
  QueryConfigValues,
  QueryResult,
  QueryResultRow,
  Submittable,
} from "pg";

interface IDatabaseQuery {
  query<T extends Submittable>(queryStream: T): T;
  // tslint:disable:no-unnecessary-generics
  query<R extends any[] = any[], I = any[]>(
    queryConfig: QueryArrayConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<QueryArrayResult<R>>;
  query<R extends QueryResultRow = any, I = any[]>(
    queryConfig: QueryConfig<I>
  ): Promise<QueryResult<R>>;
  query<R extends QueryResultRow = any, I = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    values?: QueryConfigValues<I>
  ): Promise<QueryResult<R>>;
  query<R extends any[] = any[], I = any[]>(
    queryConfig: QueryArrayConfig<I>,
    callback: (err: Error, result: QueryArrayResult<R>) => void
  ): void;
  query<R extends QueryResultRow = any, I = any[]>(
    queryTextOrConfig: string | QueryConfig<I>,
    callback: (err: Error, result: QueryResult<R>) => void
  ): void;
  query<R extends QueryResultRow = any, I = any[]>(
    queryText: string,
    values: QueryConfigValues<I>,
    callback: (err: Error, result: QueryResult<R>) => void
  ): void;
}

export function initContact(route: Router) {
  const pool = getPool();

  route.post(
    "/api/getContacts",
    httpAuth,
    async (ctx) => {
      const userID = ctx.request.jwt.payload.sub;

      const result = await pool.query(
        `
      SELECT
        id,
        name,
        avatar_url
      FROM
        (
          SELECT
            CASE 
              WHEN id = $1 THEN contact_user_id
              ELSE id
            END AS contact_user_id
          FROM
            chatapp.users AS usersA
          INNER JOIN
            chatapp.contacts ON id = user_id
          WHERE
            usersA.id = $1 OR contact_user_id = $1
        )
      INNER JOIN chatapp.users ON contact_user_id = chatapp.users.id
    `,
        [userID]
      );

      ctx.body = result.rows.map((item) => ({
        id: String(item.id),
        name: item.name,
        avatarURL: item.avatar_url
      }));
    }
  );

  route.post(
    "/api/createAddContactRequest",
    httpAuth,
    requestBodyContentType("application/json"),
    async (ctx) => {
      type RequestBody = { recipientID: string };
      const requestBody = ctx.request.body as RequestBody;
      const requesterID = ctx.request.jwt.payload.sub;
      const recipientID = requestBody.recipientID;

      if (recipientID === requesterID) {
        ctx.throw(400, "The recipient is yourself");
      }

      let client = await pool.connect();

      try {
        if (await alreadyInTheContactList(client, recipientID, requesterID)) {
          ctx.throw(400, "Already in the contact list");
        }

        if (!await isUserExists(client, requestBody.recipientID)) {
          ctx.throw(400, "No such recipient");
        }

        const createdAt = new Date().toISOString();

        const result = await client.query(
          `
          INSERT INTO chatapp.add_contact_requests
            (created_at, requester_id, recipient_id, status)
          VALUES
            ($1, $2, $3, $4)
          RETURNING id;
          `,
          [createdAt, requesterID, recipientID, "pending"]
        );

        const addContactRequestID = result.rows[0].id;

        await insertAddContactRequestNotification(client, {
          createdAt,
          addContactRequestID,
          userID: requesterID,
          status: "pending",
        });

        const id = await insertAddContactRequestNotification(client, {
          createdAt,
          addContactRequestID,
          userID: recipientID,
          status: "pending",
        });

        const newNotification = await getNotification(client, id);

        emitEvent("notification/new", requesterID, newNotification);
        emitEvent("notification/new", recipientID, newNotification);

        ctx.body = null;
      } finally {
        client.release();
      }
    }
  );

  route.post(
    "/api/setAddContactRequestStatus",
    httpAuth,
    async (ctx: Context, next: () => void) => {
      type RequestBody = { requestID: string; status: string };
      const requestBody = ctx.request.body as RequestBody;

      const { status, requestID: addContactRequestID } = requestBody;
      const recipientID = Number(ctx.request.jwt.payload.sub);

      if (status !== "rejected" && status !== "agreed") {
        ctx.throw(400, "Invalid arguments");
      }

      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT requester_id FROM chatapp.add_contact_requests WHERE id = $1 AND recipient_id = $2",
          [requestBody.requestID, recipientID]
        );

        if (result.rows.length === 0) {
          ctx.throw("No such add contact request");
        }

        const requesterID = Number(result.rows[0].requester_id);
        
        if (await alreadyInTheContactList(client, String(requesterID), String(recipientID))) {
          ctx.throw(400, "Already in the contact list");
        }

        await client.query(
          "UPDATE chatapp.add_contact_requests SET status = $1 WHERE id = $2;",
          [status, addContactRequestID]
        );

        if (status === "agreed") {
          const userID = Math.min(requesterID, recipientID);
          const contactUserID = Math.max(requesterID, recipientID);
          await client.query(
            "INSERT INTO chatapp.contacts (user_id, contact_user_id) VALUES ($1, $2)",
            [userID, contactUserID]
          );
        }

        // Now the request has been agreed or rejected by the recipient,
        // and it's time to notify the requester.

        const notificationID = await insertAddContactRequestNotification(
          client,
          {
            createdAt: new Date().toISOString(),
            addContactRequestID: requestBody.requestID,
            userID: requesterID,
            status,
          }
        );

        const notification = await getNotification(client, notificationID);
        emitEvent("notification/new", requesterID, notification);

        ctx.body = null;
      } finally {
        client.release();
        next();
      }
    }
  );
}

async function getNotification(q: IDatabaseQuery, notificationID: number) {
  const { rows } = await q.query(
    `
    SELECT
      ACRN.id AS id,
      ACRN.created_at,
      ACRN.has_read,
      ACRN.request_status,
      REQ.id AS requester_id,
      REQ.name AS requester_name,
      REQ.avatar_url AS requester_avatar_url,
      REC.id AS recipient_id,
      REC.name AS recipient_name,
      REC.avatar_url AS recipient_avatar_url,
      ACR.id AS add_contact_request_id
    FROM
      chatapp.add_contact_request_notifications AS ACRN
    INNER JOIN chatapp.add_contact_requests AS ACR
      ON ACRN.add_contact_request_id = ACR.id 
    INNER join chatapp.users AS REQ
      ON ACR.requester_id = REQ.id
    INNER JOIN chatapp.users AS REC
      ON ACR.recipient_id = REC.id
    WHERE
      ACRN.id = $1
    `,
    [notificationID]
  );

  if (rows.length === 0) {
    return null;
  } else {
    return {
      id: rows[0].id,
      type: "add contact request",
      createdAt: rows[0].created_at,
      hasRead: rows[0].has_read,
      request: {
        id: rows[0].add_contact_request_id,
        fromUser: {
          id: rows[0].requester_id,
          name: rows[0].requester_name,
          avatarURL: rows[0].requester_avatar_url,
        },
        toUser: {
          id: rows[0].recipient_id,
          name: rows[0].recipient_name,
          avatarURL: rows[0].recipient_avatar_url,
        },
        requestStatus: rows[0].request_status,
      },
    };
  }
}

async function insertAddContactRequestNotification(
  client: IDatabaseQuery,
  { createdAt, addContactRequestID, userID, status }
) {
  // Insert a new notification for who send the request.
  const { rows } = await client.query(
    `
    INSERT INTO chatapp.add_contact_request_notifications
      (created_at, has_read, add_contact_request_id, user_id, request_status)
    VALUES
      ($1, $2, $3, $4, $5)
    RETURNING id;
    `,
    [createdAt, false, addContactRequestID, userID, status]
  );

  return rows[0].id;
}

async function alreadyInTheContactList(client: IDatabaseQuery, userID_1: string, userID_2: string) {
  let smallerID: string;
  let greaterID: string;

  if (Number(userID_1) < Number(userID_2)) {
    smallerID = userID_1;
    greaterID = userID_2;
  } else {
    smallerID = userID_2;
    greaterID = userID_1;
  }

  let { rowCount } = await client.query(
    "SELECT user_id FROM chatapp.contacts WHERE user_id = $1 AND contact_user_id = $2",
    [smallerID, greaterID]
  );

  return rowCount > 0;
}

async function isUserExists(client: IDatabaseQuery, userID: string) {
  let { rows } = await client.query(
    "SELECT id FROM chatapp.users WHERE id = $1",
    [userID]
  );

  return rows.length > 0;
}