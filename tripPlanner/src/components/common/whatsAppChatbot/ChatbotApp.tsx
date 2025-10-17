import SendRoundedIcon from "@mui/icons-material/SendRounded";
import EmojiEmotionsOutlinedIcon from "@mui/icons-material/EmojiEmotionsOutlined";
import AttachFileOutlinedIcon from "@mui/icons-material/AttachFileOutlined";
import MicNoneOutlinedIcon from "@mui/icons-material/MicNoneOutlined";
import MoreVertIcon from "@mui/icons-material/MoreVert";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useMediaQuery, createTheme, AppBar, Avatar, Box, CssBaseline, IconButton, ThemeProvider, Toolbar, Typography, CircularProgress, Container, InputAdornment, Paper, Stack, TextField } from "@mui/material";
import { useRef, useEffect, useMemo, useState } from "react";
import React from "react";

type Role = "user" | "bot";

type ChatMessage = {
  id: string;
  role: Role;
  text: string;
  time: string;
};

const CHAT_API_URL = "http://localhost:8080/api/chatbot/chat";

const USER_PHONE = "1234567890";

function formatTime(d = new Date()) {
  const opts: Intl.DateTimeFormatOptions = { hour: "numeric", minute: "2-digit" };
  return new Intl.DateTimeFormat(undefined, opts).format(d);
}

function useAutoScroll(dep: any) {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    if (ref.current) {
      ref.current.scrollTop = ref.current.scrollHeight;
    }
  }, [dep]);
  return ref;
}

export default function ChatbotApp() {
  const prefersDark = useMediaQuery("(prefers-color-scheme: dark)");
  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "dark",
          background: {
            default: "#0b141a",
            paper: "#111b21",
          },
          primary: {
            main: "#00a884"
          },
          text: {
            primary: "#e9edef",
            secondary: "#8696a0",
          },
        },
        shape: { borderRadius: 12 },
      }),
    []
  );

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: crypto.randomUUID(),
      role: "bot",
      text: "Hi!",
      time: formatTime(),
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const listRef = useAutoScroll(messages);

  // Initialize user state on component mount
  useEffect(() => {
    const initializeChat = async () => {
      try {
        const res = await fetch(`http://localhost:8080/api/chatbot/user-state/${USER_PHONE}`, {
          method: "GET",
          headers: { "Content-Type": "application/json", },
        });
        
        if (res.ok) {
          const data = await res.json();
          if (data.message) {
            const welcomeMsg: ChatMessage = {
              id: crypto.randomUUID(),
              role: "bot",
              text: data.message,
              time: formatTime(),
            };
            setMessages(prev => [...prev, welcomeMsg]);
          }
        }
      } catch (err) {
        console.error("Failed to initialize chat:", err);
      }
    };

    initializeChat();
  }, []);

  const send = async () => {
    const trimmed = input.trim();
    if (!trimmed || loading) return;

    const userMsg: ChatMessage = {
      id: crypto.randomUUID(),
      role: "user",
      text: trimmed,
      time: formatTime(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch(CHAT_API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: trimmed,
          phoneNumber: USER_PHONE,
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      
      const data = await res.json();

      const botText =
        typeof data?.message === "string" && data.message.length > 0
          ? data.message
          : "";

      const botMsg: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: botText,
        time: formatTime(),
      };
      setMessages((prev) => [...prev, botMsg]);
      
    } catch (err) {
      console.error("Chat error:", err);
      const botErr: ChatMessage = {
        id: crypto.randomUUID(),
        role: "bot",
        text: "sorry",
        time: formatTime(),
      };
      setMessages((prev) => [...prev, botErr]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown: React.KeyboardEventHandler<HTMLInputElement> = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const ChatBubble = ({ m }: { m: ChatMessage }) => {
    const isUser = m.role === "user";
    return (
      <Box sx={{
        display: "flex",
        justifyContent: isUser ? "flex-end" : "flex-start",
        px: 1,
      }}>
        {!isUser && (
          <Avatar sx={{ width: 28, height: 28,mr: 1, mt: "auto", bgcolor: "#00a884", color: "#0b141a", fontSize: 14, fontWeight: 700,}}> B </Avatar>
        )}

        <Box sx={{ maxWidth: "78%",position: "relative", bgcolor: isUser ? "#005c4b" : "#202c33", color: "#e9edef",p: 1.2, px: 1.5,borderRadius: 2, boxShadow: "0 1px 0 rgba(0,0,0,0.1)",
          "&:after": {content: '""', position: "absolute",bottom: 0, width: 0, height: 0, borderStyle: "solid",...(isUser
              ? {right: -6, borderWidth: "6px 0 0 6px",borderColor: "transparent transparent transparent #005c4b", }
              : { left: -6, borderWidth: "6px 6px 0 0", borderColor: "transparent #202c33 transparent transparent", }), },}}>
          <Typography sx={{ whiteSpace: "pre-wrap" }}>{m.text}</Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mt: 0.25 }}>
            <Typography variant="caption" sx={{ color: "#aebac1" }}>
              {m.time}
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ height: "100vh", bgcolor: "background.default",display: "flex", flexDirection: "column", }}>
        {/* Header */}
        <AppBar position="sticky" elevation={0} sx={{ bgcolor: "#202c33", borderBottom: "1px solid #1f2c33" }}>
          <Toolbar sx={{ minHeight: 64 }}>
            <IconButton color="inherit" edge="start" sx={{ mr: 1, display: { xs: "inline-flex", md: "none" } }}>
              <ArrowBackIcon />
            </IconButton>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "#00a884", color: "#0b141a", fontWeight: 700, mr: 1 }}> B </Avatar>
            <Box sx={{ flexGrow: 1 }}>
              <Typography variant="subtitle1" sx={{ color: "#e9edef", lineHeight: 1.1 }}>  Hotel Booking Bot</Typography>
              <Typography variant="caption" sx={{ color: "#8696a0" }}> {loading ? "Typing..." : "Online"}</Typography>
            </Box>
            <IconButton color="inherit"> <MoreVertIcon /> </IconButton>
          </Toolbar>
        </AppBar>

        <Box ref={listRef} sx={{ flex: 1, overflowY: "auto", backgroundImage: "url(/shiv.jpeg)",backgroundSize: "cover",backgroundPosition: "center", position: "relative", }} >
          <Box sx={{ position: "relative", inset: 0,bgcolor: "rgba(11,20,26,0.6)",pointerEvents: "none",}} />
          <Container maxWidth="md" sx={{ position: "relative", py: 2 }}>
            <Stack spacing={1.2}>{messages.map((m) => ( <ChatBubble key={m.id} m={m} /> ))}
              {loading && (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, px: 1, ml: 5 }}>
                  <CircularProgress size={16} sx={{ color: "#8696a0" }} />
                  <Typography variant="caption" sx={{ color: "#aebac1" }}> Bot typing... </Typography>
                </Box>
              )}
            </Stack>
          </Container>
        </Box>

        {/* Footer */}
        <Paper elevation={0} square sx={{ p: 1, bgcolor: "#202c33", borderTop: "1px solid #1f2c33" }}>
          <Container maxWidth="md" sx={{ display: "flex", alignItems: "flex-end", gap: 1 }}>
            <IconButton size="small" sx={{ color: "#8696a0" }}>
              <EmojiEmotionsOutlinedIcon />
            </IconButton>
            <IconButton size="small" sx={{ color: "#8696a0" }}>
              <AttachFileOutlinedIcon />
            </IconButton>

            <TextField fullWidth  multiline maxRows={6} placeholder="Type a message" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}variant="outlined" size="small" InputProps={{ sx: { bgcolor: "#2a3942", color: "#e9edef","& .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },"&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },"&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "transparent" },  borderRadius: 3, px: 1.2, py: 0.75, },endAdornment: (<InputAdornment position="end"> <IconButton size="small" sx={{ color: "#8696a0" }}><MicNoneOutlinedIcon /> </IconButton></InputAdornment>), }}/>

            <IconButton color="primary" onClick={send}disabled={loading || input.trim().length === 0}  sx={{ bgcolor: "#00a884",  color: "#0b141a","&:hover": { bgcolor: "#06cf9c" },"&:disabled": {  bgcolor: "#8696a0", color: "#0b141a"   }}} >
              <SendRoundedIcon />
            </IconButton>
          </Container>
        </Paper>
      </Box>
    </ThemeProvider>
  );
}
