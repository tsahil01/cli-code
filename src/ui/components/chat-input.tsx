import React from "react";
import { Box } from "ink";
import { FileSelector } from "./file-selector.js";
import { CommandSuggestions } from "./command-suggestions.js";
import { AttachedFiles } from "./attached-files.js";
import { InputDisplay } from "./input-display.js";
import { useChatInput } from "./use-chat-input.js";
import { SelectedFile, Command, FunctionCall } from "../../types.js";

interface ChatInputProps {
	onSend: (message: string, files: SelectedFile[]) => void;
	commands: Command[];
	isProcessing?: boolean;
	isDisabled?: boolean;
	currentToolCall?: FunctionCall | null;
}

export const ChatInput = ({ onSend, commands, isProcessing, isDisabled, currentToolCall }: ChatInputProps) => {
	const {
		input,
		showFileSelector,
		selectedFiles,
		showSuggestions,
		selectedSuggestionIndex,
		suggestions,
		handleFileSelect,
		handleFileCancel,
	} = useChatInput({ onSend, commands, isDisabled: isProcessing || isDisabled });

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

			<InputDisplay 
				input={input} 
				isProcessing={isProcessing}
				currentToolCall={currentToolCall}
			/>
			
			<AttachedFiles files={selectedFiles} />
		</Box>
	);
};