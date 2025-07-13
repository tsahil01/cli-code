import React from 'react';
import { Box, Text } from "ink";

export const SmallHeader = () => {
    return (
        <Box flexDirection='column' alignItems='center' marginBottom={2}>
            <Text color="magenta" bold underline>{"> Welcome to CLI CODE"}</Text>
        </Box>
    )
};
