import React from "react";
import { Box, Text } from "ink";
import { Command } from "../../types.js";

interface CommandSuggestionsProps {
	suggestions: Command[];
	selectedIndex: number;
	visible: boolean;
}

export const CommandSuggestions = ({ suggestions, selectedIndex, visible }: CommandSuggestionsProps) => {
	if (!visible || suggestions.length === 0) {
		return null;
	}

	return (
		<Box
			flexDirection="column"
			borderStyle="round"
			borderColor="yellow"
			marginBottom={1}
		>
			<Text color="yellow" bold>Available Commands:</Text>
			{suggestions.map((cmd, index) => (
				<Box key={cmd.name} paddingLeft={1}>
					<Text
						color={index === selectedIndex ? "black" : "white"}
						backgroundColor={index === selectedIndex ? "yellow" : undefined}
					>
						/{cmd.name} - {cmd.description}
					</Text>
				</Box>
			))}
			<Text color="gray" dimColor>Use ↑↓ to navigate, Tab/Enter to complete, Esc to close</Text>
		</Box>
	);
}; 