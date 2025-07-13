import React from 'react';
import { Box, Text } from "ink";
import BigText from 'ink-big-text';
import { Command } from "@/types";

const Commands = () => (
    <Box flexDirection="column" alignItems="flex-start">
            <Box>
                <Text italic>/help</Text>
                <Box marginLeft={1} />
                <Text color="gray">Show help</Text>
            </Box>
    </Box>
);

export const Header = () => {
    return (
        <Box flexDirection='column' alignItems='center' marginBottom={2}>
            <BigText text="CLI CODE" font='block' colors={['#999', '#aaa', '#bbb', '#ccc', '#ddd', '#eee']} />
            <Commands />
        </Box>
    )
};
