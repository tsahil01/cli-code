import React from "react";
import { Box } from "ink";
import { FileSelector } from "./file-selector.js";
import { CommandSuggestions } from "./command-suggestions.js";
import { AttachedFiles } from "./attached-files.js";
import { InputDisplay } from "./input-display.js";
import { useChatInput } from "./use-chat-input.js";
import { SelectedFile, Command } from "../../types.js";

export const ChatInput = ({ onSend, commands }: { onSend: (message: string, files: SelectedFile[]) => void, commands: Command[] }) => {
	const {
		input,
		showFileSelector,
		selectedFiles,
		showSuggestions,
		selectedSuggestionIndex,
		suggestions,
		handleFileSelect,
		handleFileCancel,
	} = useChatInput({ onSend, commands });

	return (
		<Box flexDirection="column">
			{showFileSelector && (
				<FileSelector onSelect={handleFileSelect} onCancel={handleFileCancel} />
			)}

			<CommandSuggestions
				suggestions={suggestions}
				selectedIndex={selectedSuggestionIndex}
				visible={showSuggestions}
			/>

			<InputDisplay input={input} />
			
			<AttachedFiles files={selectedFiles} />
		</Box>
	);
};