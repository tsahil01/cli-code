import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import process from 'process';

export const CurrentDirectory = () => {
    const [currentDir, setCurrentDir] = useState<string>('');

    useEffect(() => {
        const updateDirectory = () => {
            setCurrentDir(process.cwd());
        };
        updateDirectory();
        const interval = setInterval(updateDirectory, 1000);

        return () => clearInterval(interval);
    }, []);

    return (
        <Box>
            <Text color="gray">
                {`${currentDir}`}
            </Text>
        </Box>
    );
}; 