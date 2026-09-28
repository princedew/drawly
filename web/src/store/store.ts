import { create } from "zustand";
import { persist } from "zustand/middleware";
import { Tool } from "../../../package/utils/constObjects";
import type { DRAWING_COLORS } from "../utils/utils";

type Tool = "PENCIL" | "RECTANGLE";
export type DrawingColor = keyof typeof DRAWING_COLORS;

type RoomData = { roomId: number; roomName: string };
type Store = {
  userId: number | null;
  tool: Tool;
  color: DrawingColor;
  roomData: RoomData | null;
  setRoom: ({ roomId, roomName }: { roomId: number; roomName: string }) => void;
  clearRoom: () => void;
  clearSession: () => void;
  setUserId: (userId: number) => void;
  setTool: (tool: Tool) => void;
  setColor: (color: DrawingColor) => void;
};

export const useStore = create<Store>()(
  persist(
    (set) => ({
      userId: null,
      tool: Tool.PENCIL,
      color: "GRAY",
      roomData: null,
      setRoom: (roomData) => set({ roomData }),
      clearRoom: () => set({ roomData: null }),
      clearSession: () => set({ userId: null, roomData: null }),
      setUserId: (userId: number) => set({ userId }),
      setTool: (tool: Tool) => set({ tool }),
      setColor: (color: DrawingColor) => set({ color }),
    }),
    {
      name: "drawly-session",
      partialize: (state) => ({ userId: state.userId }),
    },
  ),
);
