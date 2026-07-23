import { Box, IconButton, Stack, TextField, Typography } from '@mui/material';
import type { ChatMessageDTO, ChatThreadDTO } from '@back2u/shared-types';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { EmptyState, ChatSkeleton, ListSkeleton } from '@back2u/ui-web';
import ImageOutlinedIcon from '@mui/icons-material/ImageOutlined';
import CloseIcon from '@mui/icons-material/Close';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DoneAllRoundedIcon from '@mui/icons-material/DoneAllRounded';
import ChatBubbleOutlineRoundedIcon from '@mui/icons-material/ChatBubbleOutlineRounded';
import ForumRoundedIcon from '@mui/icons-material/ForumRounded';

import { api } from '../lib/api.js';
import { useAuth } from '../lib/auth.store.js';
import { getSocket } from '../lib/socket.js';
import { uploadImage } from '../lib/cloudinary-upload.js';
import { ImageLightbox } from '../components/ImageLightbox.js';

const INK = '#0B3D38';
const PAPER = '#FBF6EC';
const TEAL = '#0F766E';
const MARIGOLD = '#E0A106';
const AVATARS = ['#0F766E', '#C2410C', '#E0A106', '#6D28D9', '#0EA5E9', '#DB2777'];

function colorFor(s: string) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return AVATARS[h % AVATARS.length];
}
function initials(name: string) {
  const p = name.trim().split(/\s+/);
  return ((p[0]?.[0] ?? '') + (p[1]?.[0] ?? '')).toUpperCase() || '?';
}
function fmtTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

function Avatar({ name, size = 40 }: { name: string; size?: number }) {
  return (
    <Box
      sx={{
        width: size,
        height: size,
        borderRadius: '50%',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        color: '#fff',
        fontWeight: 800,
        fontSize: size * 0.36,
        bgcolor: colorFor(name),
      }}
    >
      {initials(name)}
    </Box>
  );
}

export function ChatPage() {
  const user = useAuth((s) => s.user);
  const qc = useQueryClient();
  const [active, setActive] = useState<string | null>(null);
  const [draft, setDraft] = useState('');
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<{ url: string; alt?: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const previewUrls = useMemo(
    () => selectedFiles.map((f) => URL.createObjectURL(f)),
    [selectedFiles],
  );
  useEffect(() => {
    return () => {
      previewUrls.forEach((url) => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const { data: threads } = useQuery({
    queryKey: ['threads'],
    queryFn: () => api.listThreads(),
  });

  const { data: messages } = useQuery({
    queryKey: ['messages', active],
    queryFn: () => api.getMessages(active!),
    enabled: !!active,
  });

  const send = useMutation({
    mutationFn: async ({ body, images }: { body: string; images?: { url: string }[] }) => {
      return api.sendMessage({ threadId: active!, body, images });
    },
    onSuccess: () => {
      setDraft('');
      setSelectedFiles([]);
      qc.invalidateQueries({ queryKey: ['messages', active] });
    },
  });

  const markRead = useMutation({
    mutationFn: ({ threadId, messageId }: { threadId: string; messageId: string }) =>
      api.markMessageRead(threadId, messageId),
  });

  useEffect(() => {
    if (!active) return;
    const s = getSocket();
    s.emit('thread:join', active);

    const onNew = (msg: ChatMessageDTO) => {
      qc.invalidateQueries({ queryKey: ['messages', active] });
      // Auto-mark incoming messages from others as read
      if (msg.authorId !== user?.id && active) {
        api.markMessageRead(active, msg.id).catch(() => {});
      }
    };

    const onRead = () => {
      qc.invalidateQueries({ queryKey: ['messages', active] });
    };

    const onTyping = (payload: { threadId: string; userId: string; typing: boolean }) => {
      if (payload.threadId === active && payload.userId !== user?.id) {
        setTypingUserId(payload.typing ? payload.userId : null);
      }
    };

    s.on('message:new', onNew);
    s.on('chat:read', onRead);
    s.on('chat:typing', onTyping);

    return () => {
      s.emit('thread:leave', active);
      s.off('message:new', onNew);
      s.off('chat:read', onRead);
      s.off('chat:typing', onTyping);
      setTypingUserId(null);
    };
  }, [active, qc, user?.id]);

  // Auto-mark all visible messages from others as read when thread opens/messages load
  const lastMarkedThreadRef = useRef<string | null>(null);
  useEffect(() => {
    if (!active || !messages || !user) return;
    if (lastMarkedThreadRef.current === active) return;
    lastMarkedThreadRef.current = active;
    messages.forEach((m) => {
      if (m.authorId !== user.id && !m.readBy?.includes(user.id)) {
        markRead.mutate({ threadId: active, messageId: m.id });
      }
    });
  }, [active, messages, user?.id, markRead]);

  // Keep the latest message in view.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typingUserId]);

  const handleTyping = useCallback(
    (value: string) => {
      setDraft(value);
      if (!active) return;

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      api.sendTyping(active, true).catch(() => {});

      debounceTimerRef.current = setTimeout(() => {
        api.sendTyping(active, false).catch(() => {});
      }, 500);
    },
    [active],
  );

  const handleSend = async () => {
    const trimmed = draft.trim();
    if (!trimmed && selectedFiles.length === 0) return;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    api.sendTyping(active!, false).catch(() => {});

    let images: { url: string }[] | undefined;
    if (selectedFiles.length > 0) {
      setUploading(true);
      try {
        const uploaded = await Promise.all(selectedFiles.map((f) => uploadImage(f)));
        images = uploaded.map((img) => ({ url: img.url }));
      } finally {
        setUploading(false);
      }
    }

    send.mutate({ body: trimmed, images });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;
    setSelectedFiles((prev) => {
      const combined = [...prev, ...files];
      return combined.slice(0, 3);
    });
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const openLightbox = (images: { url: string }[], index: number) => {
    setLightboxImages(images.map((img) => ({ url: img.url })));
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const otherParticipantName = useCallback(
    (t: ChatThreadDTO) => {
      const otherId = t.participantIds.find((id) => id !== user?.id);
      return otherId ? `User ${otherId.slice(-6)}` : 'Thread';
    },
    [user?.id],
  );

  const canSend =
    (draft.trim().length > 0 || selectedFiles.length > 0) && !send.isPending && !uploading;
  const activeThread = threads?.find((t) => t.id === active);
  const activeName = activeThread ? otherParticipantName(activeThread) : '';

  return (
    <Box sx={{ maxWidth: 1080, mx: 'auto' }}>
      <Typography
        sx={{
          color: 'primary.main',
          fontWeight: 700,
          letterSpacing: '0.14em',
          textTransform: 'uppercase',
          fontSize: 12,
          mb: 0.5,
        }}
      >
        Messages
      </Typography>
      <Typography
        sx={{
          fontFamily: '"Black Ops One", Georgia, serif',
          fontWeight: 600,
          fontSize: 30,
          color: 'text.primary',
          mb: 2.5,
        }}
      >
        Conversations
      </Typography>

      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: { xs: '1fr', md: '300px 1fr' },
          height: { xs: 'auto', md: '72vh' },
          borderRadius: '24px 24px 24px 8px',
          overflow: 'hidden',
          border: '1px solid',
          borderColor: 'divider',
          bgcolor: 'background.paper',
          boxShadow: '0 30px 60px -45px rgba(11,61,56,0.5)',
        }}
      >
        {/* Threads pane */}
        <Box
          sx={{
            borderRight: { md: '1px solid' },
            borderColor: { md: 'divider' },
            borderBottom: { xs: '1px solid', md: 'none' },
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0,
            bgcolor: 'rgba(11,61,56,0.015)',
          }}
        >
          <Box sx={{ px: 2.5, py: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
            <Typography sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15 }}>
              Chats
            </Typography>
          </Box>
          <Box sx={{ flex: 1, overflowY: 'auto', p: 1 }}>
            {threads === undefined ? (
              <Box sx={{ p: 1 }}>
                <ListSkeleton rows={5} />
              </Box>
            ) : threads.length === 0 ? (
              <EmptyState
                dense
                tone="teal"
                icon={<ForumRoundedIcon />}
                title="No conversations yet"
                description="When you connect over a lost or found item, your chats land here."
              />
            ) : (
              <Stack spacing={0.5}>
                {threads.map((t) => (
                  <ThreadRow
                    key={t.id}
                    name={otherParticipantName(t)}
                    time={t.lastMessageAt}
                    active={active === t.id}
                    onClick={() => setActive(t.id)}
                  />
                ))}
              </Stack>
            )}
          </Box>
        </Box>

        {/* Conversation pane */}
        <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: 0, minWidth: 0 }}>
          {!active ? (
            <Box sx={{ flex: 1, display: 'grid', placeItems: 'center', minHeight: 340 }}>
              <EmptyState
                tone="marigold"
                icon={<ChatBubbleOutlineRoundedIcon />}
                title="Pick a conversation"
                description="Select a chat on the left to see your messages and reply in real time."
              />
            </Box>
          ) : (
            <>
              {/* Conversation header */}
              <Stack
                direction="row"
                spacing={1.5}
                sx={{
                  alignItems: 'center',
                  px: 2.5,
                  py: 1.75,
                  borderBottom: '1px solid',
                  borderColor: 'divider',
                  flexShrink: 0,
                }}
              >
                <Avatar name={activeName} size={42} />
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    sx={{ fontWeight: 700, color: 'text.primary', fontSize: 15.5 }}
                    noWrap
                  >
                    {activeName}
                  </Typography>
                  <Typography sx={{ fontSize: 12.5, color: 'text.secondary' }} noWrap>
                    {typingUserId ? 'typing…' : 'Reuniting an item'}
                  </Typography>
                </Box>
              </Stack>

              {/* Messages */}
              <Box
                sx={{
                  flex: 1,
                  overflowY: 'auto',
                  minHeight: 320,
                  px: 2.5,
                  py: 2,
                  background:
                    'radial-gradient(120% 80% at 50% 0%, rgba(15,118,110,0.04), transparent 60%)',
                }}
              >
                {messages === undefined ? (
                  <ChatSkeleton rows={6} />
                ) : (
                  messages.map((m) => {
                    const isMine = m.authorId === user?.id;
                    const otherRead = isMine && m.readBy?.some((id) => id !== user?.id);
                    return (
                      <Box
                        key={m.id}
                        sx={{
                          mb: 1.25,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: isMine ? 'flex-end' : 'flex-start',
                        }}
                      >
                        <Box
                          sx={{
                            px: 1.75,
                            py: 1.1,
                            maxWidth: '78%',
                            bgcolor: isMine ? INK : PAPER,
                            color: isMine ? PAPER : INK,
                            border: isMine ? 'none' : '1px solid rgba(11,61,56,0.12)',
                            borderRadius: isMine ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                            boxShadow: isMine ? '0 12px 24px -18px rgba(11,61,56,0.7)' : 'none',
                          }}
                        >
                          {m.body && (
                            <Typography
                              sx={{
                                fontSize: 14.5,
                                lineHeight: 1.5,
                                whiteSpace: 'pre-wrap',
                                wordBreak: 'break-word',
                              }}
                            >
                              {m.body}
                            </Typography>
                          )}
                          {m.images && m.images.length > 0 && (
                            <Stack
                              direction="row"
                              spacing={1}
                              sx={{ mt: m.body ? 1 : 0, flexWrap: 'wrap' }}
                            >
                              {m.images.map((img, idx) => (
                                <Box
                                  key={`${m.id}-${idx}`}
                                  component="img"
                                  src={img.url}
                                  alt=""
                                  onClick={() => openLightbox(m.images!, idx)}
                                  sx={{
                                    width: 96,
                                    height: 96,
                                    objectFit: 'cover',
                                    borderRadius: 2,
                                    cursor: 'pointer',
                                    flexShrink: 0,
                                  }}
                                />
                              ))}
                            </Stack>
                          )}
                          {m.flagged && (
                            <Typography
                              sx={{
                                display: 'block',
                                mt: 0.5,
                                fontSize: 11,
                                color: MARIGOLD,
                                fontWeight: 700,
                              }}
                            >
                              flagged
                            </Typography>
                          )}
                        </Box>
                        <Stack
                          direction="row"
                          spacing={0.5}
                          sx={{ alignItems: 'center', mt: 0.4, px: 0.5 }}
                        >
                          <Typography sx={{ fontSize: 11, color: 'text.secondary' }}>
                            {fmtTime(m.createdAt)}
                          </Typography>
                          {otherRead && (
                            <DoneAllRoundedIcon sx={{ fontSize: 14, color: 'primary.main' }} />
                          )}
                        </Stack>
                      </Box>
                    );
                  })
                )}

                {typingUserId && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-start', mt: 0.5 }}>
                    <Box
                      sx={{
                        px: 2,
                        py: 1.25,
                        bgcolor: PAPER,
                        border: '1px solid rgba(11,61,56,0.12)',
                        borderRadius: '18px 18px 18px 4px',
                        display: 'flex',
                        gap: 0.6,
                        '@keyframes b2uTyping': {
                          '0%, 60%, 100%': { transform: 'translateY(0)', opacity: 0.4 },
                          '30%': { transform: 'translateY(-4px)', opacity: 1 },
                        },
                      }}
                    >
                      {[0, 1, 2].map((i) => (
                        <Box
                          key={i}
                          sx={{
                            width: 7,
                            height: 7,
                            borderRadius: '50%',
                            bgcolor: TEAL,
                            animation: 'b2uTyping 1.2s infinite ease-in-out',
                            animationDelay: `${i * 0.18}s`,
                          }}
                        />
                      ))}
                    </Box>
                  </Box>
                )}
                <div ref={bottomRef} />
              </Box>

              {/* Composer */}
              <Box sx={{ p: 1.5, borderTop: '1px solid', borderColor: 'divider', flexShrink: 0 }}>
                {selectedFiles.length > 0 && (
                  <Stack direction="row" spacing={1} sx={{ mb: 1, flexWrap: 'wrap' }}>
                    {selectedFiles.map((file, idx) => (
                      <Box key={idx} sx={{ position: 'relative' }}>
                        <Box
                          component="img"
                          src={previewUrls[idx]}
                          alt=""
                          sx={{ width: 64, height: 64, objectFit: 'cover', borderRadius: 2 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => handleRemoveFile(idx)}
                          sx={{
                            position: 'absolute',
                            top: -8,
                            right: -8,
                            bgcolor: 'background.paper',
                            border: '1px solid',
                            borderColor: 'divider',
                            width: 22,
                            height: 22,
                            '&:hover': { bgcolor: 'action.hover' },
                          }}
                        >
                          <CloseIcon sx={{ fontSize: 14 }} />
                        </IconButton>
                      </Box>
                    ))}
                  </Stack>
                )}
                <Stack
                  direction="row"
                  spacing={0.5}
                  sx={{
                    alignItems: 'center',
                    borderRadius: 999,
                    border: '1px solid',
                    borderColor: 'divider',
                    bgcolor: 'background.default',
                    px: 0.75,
                    py: 0.5,
                  }}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                  />
                  <IconButton
                    onClick={() => fileInputRef.current?.click()}
                    disabled={selectedFiles.length >= 3 || uploading || send.isPending}
                    sx={{ color: 'primary.main' }}
                  >
                    <ImageOutlinedIcon />
                  </IconButton>
                  <TextField
                    fullWidth
                    variant="standard"
                    placeholder="Type a message…"
                    value={draft}
                    onChange={(e) => handleTyping(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && canSend && handleSend()}
                    disabled={uploading}
                    slotProps={{ input: { disableUnderline: true, sx: { px: 1, fontSize: 14.5 } } }}
                  />
                  <IconButton
                    onClick={handleSend}
                    disabled={!canSend}
                    sx={{
                      bgcolor: canSend ? MARIGOLD : 'action.disabledBackground',
                      color: canSend ? INK : 'text.disabled',
                      '&:hover': { bgcolor: canSend ? '#cf9305' : 'action.disabledBackground' },
                      transition: 'background-color .15s',
                    }}
                  >
                    <SendRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>
              </Box>
            </>
          )}
        </Box>
      </Box>

      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </Box>
  );
}

function ThreadRow({
  name,
  time,
  active,
  onClick,
}: {
  name: string;
  time: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <Box
      onClick={onClick}
      sx={{
        p: 1.25,
        borderRadius: 2.5,
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 1.25,
        bgcolor: active ? 'rgba(15,118,110,0.10)' : 'transparent',
        border: '1px solid',
        borderColor: active ? 'rgba(15,118,110,0.25)' : 'transparent',
        transition: 'background-color .15s',
        '&:hover': { bgcolor: active ? 'rgba(15,118,110,0.12)' : 'action.hover' },
      }}
    >
      <Avatar name={name} size={42} />
      <Box sx={{ minWidth: 0, flex: 1 }}>
        <Typography noWrap sx={{ fontSize: 14, fontWeight: 700, color: 'text.primary' }}>
          {name}
        </Typography>
        <Typography noWrap sx={{ fontSize: 12, color: 'text.secondary' }}>
          {time
            ? new Date(time).toLocaleDateString([], { month: 'short', day: 'numeric' })
            : 'New thread'}
        </Typography>
      </Box>
    </Box>
  );
}
