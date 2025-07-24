import React, { useState, useEffect, memo } from 'react';
import { Box, Text } from 'ink';
import process from 'process';

export const CurrentDirectory = memo(() => {
    const [currentDir, setCurrentDir] = useState<string>(process.cwd());

    useEffect(() => {
        // Only set once on mount
        setCurrentDir(process.cwd());
    }, []);

    return (
        <Box>
            <Text color="gray">
                {`${currentDir}`}
            </Text>
        </Box>
    );
}); 