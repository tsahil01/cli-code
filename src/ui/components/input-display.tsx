import React from "react";
import { Box, Text } from "ink";

interface InputDisplayProps {
	input: string;
}

export const InputDisplay = ({ input }: InputDisplayProps) => {
	return (
		<Box 
			borderStyle="round" 
			borderColor="gray"
			marginTop={1}
		>
			<Text color="blue" bold>❯ </Text>
			<Text color="white">
				{input ? (() => {
					const parts = input.split(/(@[^\s]+)/g);
					return parts.map((part, index) => {
						if (part.startsWith('@')) {
							return <Text key={index} color="green">{part}</Text>;
						}
						return <Text key={index} color="white">{part}</Text>;
					});
				})() : 'Ask me anything...'}
			</Text>
			<Text color="gray">|</Text>
		</Box>
	);
}; 