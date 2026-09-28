import { useMutation } from "@tanstack/react-query";
import { api } from "../config/axios";

type RoomSummary = {
  id: number;
  name: string;
  createdAt: string;
};

type RoomResponse = {
  success: boolean;
  message?: string;
  room?: RoomSummary;
};

type CreateRoomData = {
  name: string;
};

type RoomIdData = {
  roomId: number;
};

const createRoom = async ({ name }: CreateRoomData): Promise<RoomResponse> => {
  const result = await api.post<RoomResponse>("/room", { name });
  return result.data;
};
const joinRoom = async ({ roomId }: RoomIdData): Promise<RoomResponse> => {
  const result = await api.post<RoomResponse>(`/room/${roomId}/join`);
  return result.data;
};
const leaveRoom = async ({ roomId }: RoomIdData): Promise<RoomResponse> => {
  const result = await api.patch<RoomResponse>(`/room/${roomId}/leave`);
  return result.data;
};
const deleteRoom = async ({ roomId }: RoomIdData): Promise<RoomResponse> => {
  const result = await api.delete<RoomResponse>(`/room/${roomId}`);
  return result.data;
};
export function useRoom() {
  const createRoomMutation = useMutation({
    mutationFn: createRoom,
    mutationKey: ["room", "create"],
  });
  const joinRoomMutation = useMutation({
    mutationFn: joinRoom,
    mutationKey: ["room", "join"],
  });
  const leaveRoomMutation = useMutation({
    mutationFn: leaveRoom,
    mutationKey: ["room", "leave"],
  });
  const deleteRoomMutation = useMutation({
    mutationFn: deleteRoom,
    mutationKey: ["room", "delete"],
  });
  return {
    createRoom: createRoomMutation.mutateAsync,
    joinRoom: joinRoomMutation.mutateAsync,
    leaveRoom: leaveRoomMutation.mutateAsync,
    deleteRoom: deleteRoomMutation.mutateAsync,
    createRoomIsPending: createRoomMutation.isPending,
    joinRoomIsPending: joinRoomMutation.isPending,
    leaveRoomIsPending: leaveRoomMutation.isPending,
    deleteRoomIsPending: deleteRoomMutation.isPending,
    createRoomIsError: createRoomMutation.isError,
    joinRoomIsError: joinRoomMutation.isError,
    leaveRoomIsError: leaveRoomMutation.isError,
    deleteRoomIsError: deleteRoomMutation.isError,
    createRoomData: createRoomMutation.data,
    joinRoomData: joinRoomMutation.data,
    leaveRoomData: leaveRoomMutation.data,
    deleteRoomData: deleteRoomMutation.data,
  };
}
