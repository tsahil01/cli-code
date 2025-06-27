import React from "react";
import { render, Box } from "ink";
import { Agent } from "./ui/agent.js";

function UI() {
    return (
        <Box flexDirection="column">
            <Agent />
        </Box>
    )
}

render(<UI />);