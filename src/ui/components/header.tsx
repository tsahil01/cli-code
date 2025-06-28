import React from 'react';
import { Box, Text } from "ink";
import BigText from 'ink-big-text';
import { Command } from "@/types";

const Commands = ({ cmds }: { cmds: Command[] }) => (
    <Box flexDirection="column" alignItems="flex-start">
        {cmds.map(cmd => (
            <Box key={cmd.name}>
                <Text>/ {cmd.name}</Text>
                <Box marginLeft={2} />
                <Text color="gray">{cmd.description}</Text>
            </Box>
        ))}
    </Box>
);

export const Header = ({ cmds }: { cmds: Command[] }) => {
    return (
        <Box flexDirection='column' alignItems='center' marginBottom={2}>
            <BigText text="CLI CODE" font="tiny" colors={['#999', '#aaa', '#bbb', '#ccc', '#ddd', '#eee']} />
            <Text color="gray">v0.1.100</Text>
            <Box marginTop={2} />
            <Commands cmds={cmds} />
        </Box>
    )
};
