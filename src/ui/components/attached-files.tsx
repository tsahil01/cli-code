import React from "react";
import { Box, Text } from "ink";
import { SelectedFile } from "../../types.js";
import path from "path";

interface AttachedFilesProps {
	files: SelectedFile[];
}

export const AttachedFiles = ({ files }: AttachedFilesProps) => {
	if (files.length === 0) {
		return null;
	}

	return (
		<Box flexDirection="column">
			<Text color="gray">{files.length} file(s) attached</Text>
			{files.map((file, index) => (
				<Box key={index} paddingLeft={2}>
					<Text color="gray">• {path.basename(file.path)}</Text>
				</Box>
			))}
		</Box>
	);
}; 