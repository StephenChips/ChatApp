import { format } from "date-fns";
import { Close } from "@mui/icons-material";
import { Box, Button, IconButton, Typography } from "@mui/material";
import { useNavigate } from "react-router";
import { useAppSelector } from "../../store";
import {
  selectAllNotifications,
} from "../../store/notifications";
import {
  AddContactRequestNotification,
  Notification,
  RequestStatus,
} from "../../store/modeltypes";
import { selectAppUser, selectLogInToken } from "../../store/appUser";
import axios from "axios";

function NotificationItem({ notification }: { notification: Notification }) {
  const appUser = useAppSelector(selectAppUser);
  const logInToken = useAppSelector(selectLogInToken);
  const isNew = !notification.hasRead;

  if (!appUser) return <></>;

  let notificationMessage: JSX.Element;
  let statusElement: JSX.Element | null = null;

  const request = notification.request;

  if (request.toUser.id === appUser.id) {
    notificationMessage = (
      <div>
        <span style={{ fontWeight: "bold" }}>{request.fromUser.name}</span>
        &nbsp; (ChatApp ID: {request.fromUser.id}) wants to add you to his/her
        contact.
      </div>
    );

    if (request.requestStatus === "agreed") {
      statusElement = (
        <Typography variant="body2" color="green">
          AGREED
        </Typography>
      );
    } else if (request.requestStatus === "expired") {
      statusElement = (
        <Typography variant="body2" color="grey">
          REQUEST EXPIRED
        </Typography>
      );
    } else if (request.requestStatus === "rejected") {
      statusElement = (
        <Typography variant="body2" color="red">
          REJECTED
        </Typography>
      );
    } else {
      statusElement = (
        <Box display="flex" flexWrap="nowrap">
          <Button
            onClick={() => setAddContactRequestStatus(notification, "agreed")}
          >
            Agree
          </Button>
          <Button
            onClick={() => setAddContactRequestStatus(notification, "rejected")}
          >
            Reject
          </Button>
        </Box>
      );
    }
  } else {
    if (request.requestStatus === "agreed") {
      notificationMessage = (
        <div>
          <span style={{ fontWeight: "bold" }}>{request.toUser.name}</span>
          &nbsp; (ChatApp ID: {request.toUser.id}) has{" "}
          <span color="green">agreed</span> your to request to add him/her to
          your contact.
        </div>
      );
    } else if (request.requestStatus === "expired") {
      notificationMessage = (
        <div>
          Your request to add{" "}
          <span style={{ fontWeight: "bold" }}>{request.toUser.name}</span>
          &nbsp; (ChatApp ID: {request.toUser.id}) to your contact has been
          expired.
        </div>
      );
    } else if (request.requestStatus === "rejected") {
      notificationMessage = (
        <div>
          <span style={{ fontWeight: "bold" }}>{request.toUser.name}</span>
          &nbsp; (ChatApp ID: {request.toUser.id}) has{" "}
          <span color="red">rejected</span> your to request to add him/her to
          your contact.
        </div>
      );
    } else {
      notificationMessage = (
        <div>
          Your have sent request for adding contact to{" "}
          <span style={{ fontWeight: "bold" }}>{request.toUser.name}</span>
          &nbsp; (ChatApp ID: {request.toUser.id}).
        </div>
      );
    }
  }

  return (
    <Box
      sx={{
        minHeight: "50px",
        paddingX: 2,
        paddingY: 1,
        borderRadius: 1,
        bgcolor: "white",
        border: "1px solid gray",
        marginBottom: 2,
        marginX: 8,
        marginY: 2,
      }}
    >
      <div>
        {isNew ? (
          <Typography variant="overline" color="green">
            NEW NOTIFICATION
          </Typography>
        ) : null}
        <Typography display="inline" variant="body2" color="grey">
          {" "}
          {format(notification.createdAt, "Pp")}
        </Typography>
      </div>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        minHeight="40px"
      >
        {notificationMessage}
        {statusElement}
      </Box>
    </Box>
  );

  async function setAddContactRequestStatus(
    notification: AddContactRequestNotification,
    newStatus: RequestStatus,
  ) {
    await axios("/api/setAddContactRequestStatus", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${logInToken}`,
      },
      data: {
        requestID: notification.request.id,
        status: newStatus,
      },
    });
  }
}

export function NotificationWindow() {
  const navigate = useNavigate();
  const notifications = useAppSelector(selectAllNotifications);

  const HEADER_HEIGHT = "60px";

  return (
    <>
      <Box height={HEADER_HEIGHT} bgcolor={"white"}>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          margin="0 auto"
          width="95%"
          height="100%"
        >
          <Typography variant="h6">Nofitications</Typography>
          <IconButton onClick={() => navigate("/")}>
            <Close />
          </IconButton>
        </Box>
      </Box>
      <Box overflow="auto" height={`calc(100% - ${HEADER_HEIGHT})`}>
        {notifications.map((notification) => (
          <NotificationItem notification={notification} key={notification.id} />
        ))}
      </Box>
    </>
  );
}
