import {useState} from "react";
import {ollamaBridgeService} from "../services/ollamaBridgeService";

export function useOllamaBridge() {
    const sendToOllama = async (input) => {
        const {reply} = await ollamaBridgeService.call(input);
        return reply;
    };

    return {sendToOllama};
}
