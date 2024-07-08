import {
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  Typography,
  Tooltip,
  TextField,
  Button,
  Collapse,
  Divider,
  LinearProgress,
} from "@mui/material";
import PersonAddIcon from "@mui/icons-material/PersonAdd";
import { useContext, useState, useEffect } from "react";
import { MainPageContext } from "../../App";
import { User } from "../../../../store/modeltypes";

type SearchResult =
  | { status: "searching" }
  | { status: "search completed"; user?: User }
  | { status: "search failed"; error?: Error };

function useTooltip() {
  const [isVisible, setIsVisible] = useState(false);
  const [text, setText] = useState("");
  const [visibleDuration, setVisibleDuration] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    const id = setTimeout(() => setIsVisible(false), visibleDuration);

    return () => clearTimeout(id);
  }, [isVisible, visibleDuration]);

  return {
    isVisible,
    text,

    prompt(message: string, duration: number = 1500) {
      setText(message);
      setVisibleDuration(duration);
      setIsVisible(true);
    },

    close() {
      setIsVisible(false);
    },
  };
}

export function AddContactDialog() {
  const {
    isAddContactDialogOpen: isThisDialogOpen,
    closeAddContactDialog: closeThisDialog,
  } = useContext(MainPageContext);

  const tooltip = useTooltip();
  const [textFieldValue, setTextFieldValue] = useState("");
  const [isSearchResultVisible, setIsSearchResultVisible] = useState(false);
  const [searchResult, setSearchResult] = useState<SearchResult>({
    status: "searching",
  });

  useEffect(() => {
    if (!isThisDialogOpen) resetState();
  }, [isThisDialogOpen]);

  return (
    <Dialog
      open={isThisDialogOpen}
      onClose={() => closeThisDialog()}
      maxWidth={"sm"}
      fullWidth
    >
      <DialogTitle>
        <Box
          display="flex"
          justifyContent={"space-between"}
          alignItems={"center"}
        >
          Add Contact
        </Box>
      </DialogTitle>
      <DialogContent>
        <Box component="form" sx={{ marginTop: 1 }}>
          <Typography>Search user by ChatApp ID</Typography>
          <Box display="flex" alignItems="center" sx={{ marginTop: 2 }}>
            <Typography variant="h4" sx={{ color: "gray", marginRight: 2 }}>
              #
            </Typography>
            <Tooltip
              disableFocusListener
              disableHoverListener
              disableTouchListener
              title={<Typography variant="body2">{tooltip.text}</Typography>}
              open={tooltip.isVisible}
              placement="top-end"
            >
              <TextField
                label="ChatApp ID"
                fullWidth
                inputProps={{ inputMode: "numeric" }}
                onChange={onChangeTextField}
                value={textFieldValue}
              />
            </Tooltip>
          </Box>
          <Box
            sx={{ marginTop: 2 }}
            display="flex"
            justifyContent="space-between"
            width="100%"
          >
            <Button onClick={closeThisDialog}>Cancel</Button>
            <Button variant="contained" onClick={onClickSearchUserButton}>
              Search User
            </Button>
          </Box>
        </Box>
        <Collapse in={isSearchResultVisible} sx={{ marginTop: 2 }}>
          <Divider>
            {searchResult.status === "searching"
              ? "Searching"
              : "Search Result"}
          </Divider>
          <Box
            height={90}
            display="flex"
            justifyContent="center"
            alignItems="center"
          >
            {(() => {
              if (searchResult.status === "searching") {
                return <LinearProgress sx={{ width: "80%" }} />;
              } else if (searchResult.status === "search completed") {
                if (searchResult.user) {
                  const { id, name, avatarURL } = searchResult.user;
                  return (
                    <Box display="flex" flexGrow={1} alignItems="center">
                      <img
                        style={{
                          width: "40px",
                          height: "40px",
                          borderRadius: "20px",
                        }}
                        src={avatarURL}
                      />
                      <Box marginLeft={2} marginRight="auto">
                        <Box fontSize="18px" fontWeight="bold">
                          {name}
                        </Box>
                        <Box fontSize="12px">#{id}</Box>
                      </Box>
                      <Box>
                        <Button
                          startIcon={<PersonAddIcon />}
                          onClick={onClickAddToContactButton}
                        >
                          Add to Contact
                        </Button>
                      </Box>
                    </Box>
                  );
                } else {
                  return (
                    <>
                      The user you searched doesn't exist. (ChatApp ID:{" "}
                      {textFieldValue}){" "}
                    </>
                  );
                }
              } else {
                return (
                  <>
                    <Typography>
                      Somthing went wrong, cannot search the user successfully.
                    </Typography>
                    <Button onClick={onClickSearchUserButton}>Retry</Button>
                  </>
                );
              }
            })()}
          </Box>
        </Collapse>
      </DialogContent>
    </Dialog>
  );

  function onChangeTextField(
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) {
    if (Array.prototype.every.call(e.target.value, isDigit)) {
      setTextFieldValue(e.target.value);
    } else {
      tooltip.prompt("Please enter digits");
    }
  }

  async function onClickSearchUserButton() {
    if (textFieldValue === "") {
      tooltip.prompt("Please enter a ChatApp ID for searching.");
      return;
    }

    setIsSearchResultVisible(true);
    setSearchResult({ status: "searching" });

    try {
      const user = await searchUser();
      setSearchResult({ status: "search completed", user });
    } catch (e) {
      console.error(e);
      setSearchResult({ status: "search failed", error: e as Error });
    }
  }

  function onClickAddToContactButton() {
    closeThisDialog();
  }

  function resetState() {
    setTextFieldValue("");
    setIsSearchResultVisible(false);
    tooltip.close();
  }

  async function searchUser() {
    return {
      id: 1,
      name: "John",
      avatarURL:
        "https://fastly.picsum.photos/id/903/50/50.jpg?hmac=KOpCpZY7_zRGpVsF5FCfJnWk_f24Cy-5ROIOIDDYN0E",
    };
  }
}

function isDigit(ch: string) {
  return (
    ch.charCodeAt(0) >= "0".charCodeAt(0) &&
    ch.charCodeAt(0) <= "9".charCodeAt(0)
  );
}
