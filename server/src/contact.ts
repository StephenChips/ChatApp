import Router = require("koa-router");
import { emitEvent, httpAuth } from "./authorization";
import { requestBodyContentType } from "./utils";
import { getPool, transaction } from "./database";
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

  route.post("/api/getContacts", httpAuth, async (ctx) => {
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
      avatarURL: item.avatar_url,
    }));
  });

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
      if (await alreadyInTheContactList(pool, recipientID, requesterID)) {
        ctx.throw(400, "Already in the contact list");
      }

      if (!(await isUserExists(pool, requestBody.recipientID))) {
        ctx.throw(400, "No such recipient");
      }

      await transaction(async (client) => {
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
        });

        await insertAddContactRequestNotification(client, {
          createdAt,
          addContactRequestID,
          userID: recipientID,
        });
      });

      emitEvent("notifications/updated", requesterID);
      emitEvent("notifications/updated", recipientID);

      ctx.body = null;
    }
  );

  route.post("/api/setAddContactRequestStatus", httpAuth, async (ctx) => {
    type RequestBody = { requestID: string; status: string };
    const requestBody = ctx.request.body as RequestBody;

    const { status, requestID: addContactRequestID } = requestBody;
    const recipientID = ctx.request.jwt.payload.sub;

    if (status !== "rejected" && status !== "agreed") {
      ctx.throw(400, "Invalid arguments");
    }

    const result = await pool.query(
      "SELECT requester_id FROM chatapp.add_contact_requests WHERE id = $1 AND recipient_id = $2",
      [requestBody.requestID, recipientID]
    );

    if (result.rows.length === 0) {
      ctx.throw("No such add contact request");
    }

    const requesterID = result.rows[0].requester_id;

    if (await alreadyInTheContactList(pool, requesterID, recipientID)) {
      await pool.query(
        "UPDATE chatapp.add_contact_requests SET status = $1 WHERE id = $2;",
        ["expired", addContactRequestID]
      );

      emitEvent("notifications/updated", requesterID);
      emitEvent("notifications/updated", recipientID);

      ctx.throw(400, "Already in the contact list");
    }

    await transaction(async (client) => {
      await client.query(
        "UPDATE chatapp.add_contact_requests SET status = $1 WHERE id = $2;",
        [status, addContactRequestID]
      );

      if (status === "agreed") {
        const [userID, contactUserID] = minmax(requesterID, recipientID);

        await client.query(
          "INSERT INTO chatapp.contacts (user_id, contact_user_id) VALUES ($1, $2)",
          [userID, contactUserID]
        );
      }

      // Now the request has been agreed or rejected by the recipient, we should renew the notifications that relative to
      // this request, so that users will know the change.

      await client.query(
        "UPDATE chatapp.add_contact_request_notifications SET has_read = $1 WHERE add_contact_request_id = $2",
        [false, addContactRequestID]
      );
    });

    emitEvent("notifications/updated", requesterID);
    emitEvent("notifications/updated", recipientID);
    emitEvent("contacts/updated", requesterID);
    emitEvent("contacts/updated", recipientID);

    ctx.body = null;
  });

  route.post("/api/deleteContact", httpAuth, async (ctx) => {
    const deleterID = ctx.request.jwt.payload.sub; // the ID of user who deletes the contact.
    const deleteeID = ctx.request.body.userID; // The ID of user who is deleted from the contact list.
    if (typeof deleteeID !== "string") {
      ctx.throw(400, "Invalid argument");
    }

    const [userID, contactUserID] = minmax(deleterID, deleteeID);

    const pool = getPool();

    await pool.query(
      "DELETE FROM chatapp.contacts WHERE user_id = $1 AND contact_user_id = $2",
      [userID, contactUserID]
    );

    const eventData = { deleterID, deleteeID };

    emitEvent("contacts/deleted", userID, eventData);
    emitEvent("contacts/deleted", contactUserID, eventData);

    ctx.body = null;
  });
}

function minmax<T>(a: T, b: T) {
  return a < b ? [a, b] : [b, a];
}

async function insertAddContactRequestNotification(
  client: IDatabaseQuery,
  { createdAt, addContactRequestID, userID }
) {
  // Insert a new notification for who send the request.
  const { rows } = await client.query(
    `
    INSERT INTO chatapp.add_contact_request_notifications
      (created_at, has_read, add_contact_request_id, user_id)
    VALUES
      ($1, $2, $3, $4)
    RETURNING id;
    `,
    [createdAt, false, addContactRequestID, userID]
  );

  return Number(rows[0].id);
}

async function alreadyInTheContactList(
  client: IDatabaseQuery,
  userID1: string,
  userID2: string
) {
  const [smallerID, greaterID] = minmax(userID1, userID2);

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
