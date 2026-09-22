export function useWebSocket(userId: string): WebSocket | undefined {
    try {
        
        const wsc = new WebSocket("ws://localhost:8000");
        
        wsc.onopen = () => {
            console.log("CONNECTED");
            wsc.send(JSON.stringify({type: "FIRST-MSG", message:"FIRST MSG FROM CLIENT", userId:userId}))
        };

        return wsc;
    } catch (error) {
        console.log("> ERROR (useWebSocket.ts) : ", error);
    }
}
