import { useState, type SubmitEvent } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronLeft,
  DoorOpen,
  LoaderCircle,
  LogIn,
  LogOut,
  Menu,
  Pencil,
  Plus,
  Settings,
  Square,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { api } from "../config/axios";
import { useRoom } from "../hooks/useRoom";
import { useStore } from "../store/store";
import { DRAWING_COLORS } from "../utils/utils";

type MenuMode = "create" | "join" | "settings" | null;

type RoomProps = {
  wsc: WebSocket | null;
  userId: number | null;
};

export default function Room({ wsc, userId }: RoomProps) {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<MenuMode>(null);
  const [inputValue, setInputValue] = useState("");
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const roomData = useStore((state) => state.roomData);
  const tool = useStore((state) => state.tool);
  const setTool = useStore((state) => state.setTool);
  const color = useStore((state) => state.color);
  const setColor = useStore((state) => state.setColor);
  const setRoom = useStore((state) => state.setRoom);
  const clearRoom = useStore((state) => state.clearRoom);
  const clearSession = useStore((state) => state.clearSession);
  const {
    createRoom,
    joinRoom,
    leaveRoom,
    createRoomIsPending,
    joinRoomIsPending,
    leaveRoomIsPending,
  } = useRoom();

  const isPending =
    createRoomIsPending || joinRoomIsPending || leaveRoomIsPending;

  function sendRoomEvent(
    type: "CREATE-ROOM" | "JOIN-ROOM" | "LEAVE-ROOM",
    roomId: number,
  ) {
    try {
      if (!wsc) {
        throw new Error("'wsc' is not defined");
      }
      if (wsc.readyState === WebSocket.OPEN && userId !== null) {
        wsc.send(JSON.stringify({ type, roomId, userId }));
      }
    } catch (error) {
      if (error instanceof Error) {
        console.log("ERROR:", error.message);
      } else {
        console.log("ERROR:", error);
      }
    }
  }

  function openMode(nextMode: Exclude<MenuMode, null>) {
    setInputValue("");
    setMode(nextMode);
  }

  async function handleSubmit(e: SubmitEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!mode || isPending) return;

    try {
      if (mode === "create") {
        const result = await createRoom({ name: inputValue.trim() });
        if (!result.success || !result.room) {
          toast.error(result.message ?? "Could not create that room.");
          return;
        }

        setRoom({ roomId: result.room.id, roomName: result.room.name });
        sendRoomEvent("CREATE-ROOM", result.room.id);
        console.log("ROOM-ID:", result.room.id);
        toast.success(`Created room ${result.room.name}`);
      } else {
        const roomId = Number(inputValue);
        if (!Number.isSafeInteger(roomId) || roomId < 1) {
          toast.error("Enter a valid room ID.");
          return;
        }

        const result = await joinRoom({ roomId });
        if (!result.success || !result.room) {
          toast.error(result.message ?? "Could not join that room.");
          return;
        }

        setRoom({ roomId: result.room.id, roomName: result.room.name });
        sendRoomEvent("JOIN-ROOM", result.room.id);
        console.log("ROOM-ID:", result.room.id);
        toast.success(`Joined room ${result.room.name}`);
      }

      setMode(null);
      setInputValue("");
    } catch {
      toast.error(
        mode === "create"
          ? "Could not create the room. Try again."
          : "Could not join the room. Check the room ID and try again.",
      );
    }
  }

  async function handleLeaveRoom() {
    if (!roomData || isPending) return;

    try {
      const result = await leaveRoom({ roomId: roomData.roomId });
      if (!result.success) {
        toast.error(result.message ?? "Could not leave the room.");
        return;
      }

      sendRoomEvent("LEAVE-ROOM", roomData.roomId);
      toast.success(`Left room ${roomData.roomName}`);
      clearRoom();
      setMode(null);
      setInputValue("");
      setIsOpen(false);
      //   console.log("ROOM-ID:", null);
    } catch {
      toast.error("Could not leave the room. Try again.");
    }
  }

  async function handleLogout() {
    if (isLoggingOut) return;
    setIsLoggingOut(true);

    try {
      await api.post("/logout");
      wsc?.close();
      clearSession();
      setIsOpen(false);
      navigate("/auth", { replace: true });
      toast.success("You have been logged out.");
    } catch {
      toast.error("Could not log out. Please try again.");
    } finally {
      setIsLoggingOut(false);
    }
  }

  function toggleMenu() {
    setIsOpen((open) => !open);
    setMode(null);
    setInputValue("");
  }

  return (
    <div className="absolute top-4 right-4 z-30 font-sans text-[#f3f6ef]">
      <button
        type="button"
        onClick={toggleMenu}
        aria-label={isOpen ? "Close room menu" : "Open room menu"}
        aria-expanded={isOpen}
        aria-controls="room-menu"
        className="grid size-11 place-items-center rounded-lg border border-white/10 bg-[#14211d]/95 text-[#e6f1ea] shadow-lg backdrop-blur transition hover:border-[#62c9a9]/50 hover:bg-[#1b3029] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe]"
      >
        {isOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {isOpen && (
        <section
          id="room-menu"
          aria-label="Room options"
          className="absolute top-[52px] right-0 w-[min(340px,calc(100vw-2rem))] overflow-hidden rounded-xl border border-white/10 bg-[#111c1a]/[.98] p-4 shadow-2xl backdrop-blur-xl sm:p-5"
        >
          {mode === "settings" ? (
            <div>
              <button
                type="button"
                onClick={() => setMode(null)}
                className="mb-4 inline-flex items-center gap-1 rounded text-xs font-medium text-[#9aaba1] transition hover:text-[#f3f6ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe]"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <h2 className="text-base font-semibold text-[#f3f6ef]">
                Settings
              </h2>
              <p className="mt-3 mb-2 text-xs font-semibold text-[#d5e0d9]">
                Drawing tool
              </p>
              <div
                className="grid grid-cols-2 gap-2"
                role="group"
                aria-label="Drawing tool"
              >
                <button
                  type="button"
                  aria-pressed={tool === "PENCIL"}
                  onClick={() => setTool("PENCIL")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] ${tool === "PENCIL" ? "border-[#62c9a9] bg-[#62c9a9]/15 text-[#a0ead2]" : "border-white/10 bg-white/[.03] text-[#d5e0d9] hover:bg-white/[.07]"}`}
                >
                  <Pencil size={16} /> Pencil
                </button>
                <button
                  type="button"
                  aria-pressed={tool === "RECTANGLE"}
                  onClick={() => setTool("RECTANGLE")}
                  className={`flex min-h-10 items-center justify-center gap-2 rounded-md border px-3 text-sm font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] ${tool === "RECTANGLE" ? "border-[#62c9a9] bg-[#62c9a9]/15 text-[#a0ead2]" : "border-white/10 bg-white/[.03] text-[#d5e0d9] hover:bg-white/[.07]"}`}
                >
                  <Square size={16} /> Rectangle
                </button>
              </div>
              <p className="mt-4 mb-2 text-xs font-semibold text-[#d5e0d9]">
                Drawing color
              </p>
              <div
                className="grid grid-cols-3 gap-2"
                role="group"
                aria-label="Drawing color"
              >
                {Object.entries(DRAWING_COLORS).map(([name, value]) => (
                  <button
                    key={name}
                    type="button"
                    aria-label={`${name} drawing color`}
                    aria-pressed={color === name}
                    onClick={() => setColor(name)}
                    className={`flex min-h-10 items-center gap-2 rounded-md border px-2 text-xs font-medium transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] ${color === name ? "border-[#62c9a9] bg-[#62c9a9]/15 text-[#a0ead2]" : "border-white/10 bg-white/[.03] text-[#d5e0d9] hover:bg-white/[.07]"}`}
                  >
                    <span
                      aria-hidden="true"
                      className="size-4 shrink-0 rounded-full border border-white/30"
                      style={{ backgroundColor: value }}
                    />
                    {name}
                  </button>
                ))}
              </div>
            </div>
          ) : roomData ? (
            <div className="space-y-4">
              <div>
                <p className="mb-1 text-[10px] font-bold tracking-[0.14em] text-[#76cdb5]">
                  YOU ARE IN A ROOM
                </p>
                <h2 className="truncate text-lg font-semibold text-[#f3f6ef]">
                  {roomData.roomName}
                </h2>
                <p className="mt-1 text-xs text-[#9aaba1]">
                  Room ID: {roomData.roomId}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLeaveRoom}
                disabled={isPending}
                className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-[#754033] bg-[#321d19] px-3 text-sm font-semibold text-[#ffb39d] transition hover:bg-[#44251f] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9795b] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {leaveRoomIsPending ? (
                  <LoaderCircle size={16} className="animate-spin" />
                ) : (
                  <DoorOpen size={16} />
                )}
                {leaveRoomIsPending ? "Leaving room..." : "Leave room"}
              </button>
            </div>
          ) : mode ? (
            <div>
              <button
                type="button"
                onClick={() => setMode(null)}
                disabled={isPending}
                className="mb-4 inline-flex items-center gap-1 rounded text-xs font-medium text-[#9aaba1] transition hover:text-[#f3f6ef] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] disabled:opacity-50"
              >
                <ChevronLeft size={16} />
                Back
              </button>
              <h2 className="text-base font-semibold text-[#f3f6ef]">
                {mode === "create" ? "Create a room" : "Join a room"}
              </h2>
              <p className="mt-1 text-xs leading-relaxed text-[#9aaba1]">
                {mode === "create"
                  ? "Choose a name for your shared canvas."
                  : "Enter the room ID shared with you."}
              </p>
              <form onSubmit={handleSubmit} className="mt-4 space-y-3">
                <label
                  htmlFor="room-input"
                  className="block text-xs font-semibold text-[#d5e0d9]"
                >
                  {mode === "create" ? "Room name" : "Room ID"}
                </label>
                <input
                  autoFocus
                  id="room-input"
                  type={mode === "create" ? "text" : "number"}
                  min={mode === "join" ? 1 : undefined}
                  maxLength={mode === "create" ? 80 : undefined}
                  step={mode === "join" ? 1 : undefined}
                  required
                  value={inputValue}
                  onChange={(event) => setInputValue(event.target.value)}
                  placeholder={
                    mode === "create" ? "e.g. Design session" : "e.g. 42"
                  }
                  disabled={isPending}
                  className="h-10 w-full rounded-md border border-[#344640] bg-[#0b1513] px-3 text-sm text-[#f3f6ef] outline-none transition placeholder:text-[#72857b] focus-visible:border-[#67c9ad] focus-visible:ring-2 focus-visible:ring-[#67c9ad]/20 disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={isPending || !inputValue.trim()}
                  className="flex min-h-10 w-full items-center justify-center gap-2 rounded-md bg-[#62c9a9] px-3 text-sm font-bold text-[#082018] transition hover:bg-[#83dfbe] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe] disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {isPending && (
                    <LoaderCircle size={16} className="animate-spin" />
                  )}
                  {isPending
                    ? mode === "create"
                      ? "Creating room..."
                      : "Joining room..."
                    : mode === "create"
                      ? "Create room"
                      : "Join room"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <p className="mb-3 text-[10px] font-bold tracking-[0.14em] text-[#76cdb5]">
                ROOMS
              </p>
              <div className="space-y-2">
                {/* CREATE ROOM BTN */}
                <button
                  type="button"
                  onClick={() => openMode("create")}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] px-3 text-left text-sm font-medium text-[#e6f1ea] transition hover:border-[#62c9a9]/40 hover:bg-[#1b3029] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe]"
                >
                  <span className="grid size-8 place-items-center rounded-md bg-[#62c9a9]/15 text-[#83dfbe]">
                    <Plus size={17} />
                  </span>
                  Create a room
                </button>

                {/* JOIN ROOM BTN */}
                <button
                  type="button"
                  onClick={() => openMode("join")}
                  className="flex min-h-11 w-full items-center gap-3 rounded-lg border border-white/10 bg-white/[.03] px-3 text-left text-sm font-medium text-[#e6f1ea] transition hover:border-[#62c9a9]/40 hover:bg-[#1b3029] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe]"
                >
                  <span className="grid size-8 place-items-center rounded-md bg-[#f2ce72]/15 text-[#f2ce72]">
                    <LogIn size={17} />
                  </span>
                  Join a room
                </button>
              </div>
            </div>
          )}
          <div className="mt-4 space-y-2 border-t border-white/10 pt-4">
            {/* SETTINGS BTN */}
            <button
              type="button"
              onClick={() => setMode("settings")}
              className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-medium text-[#d5e0d9] transition hover:bg-white/[.06] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#83dfbe]"
            >
              <Settings size={17} /> Settings
            </button>

            {/* LOGOUT BTN */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isLoggingOut}
              className="flex min-h-10 w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-semibold text-[#ffb39d] transition hover:bg-[#e9795b]/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e9795b] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoggingOut ? (
                <LoaderCircle size={17} className="animate-spin" />
              ) : (
                <LogOut size={17} />
              )}
              {isLoggingOut ? "Logging out..." : "Log out"}
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
