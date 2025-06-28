import React from 'react';
import { Box, Text } from 'ink';
import { marked, Tokens, Token } from 'marked';

interface MarkdownRendererProps {
    content: string;
    baseColor?: string;
    dimmed?: boolean;
}

type MarkdownElement = React.ReactElement | string;

const renderMarkdownElement = (element: Token, baseColor: string, dimmed: boolean): MarkdownElement => {
    switch (element.type) {
        case 'heading': {
            const headingToken = element as Tokens.Heading;
            return (
                <Box key={Math.random()}>
                    <Text bold color={baseColor} dimColor={dimmed}>
                        {'#'.repeat(headingToken.depth)} {headingToken.text}
                    </Text>
                </Box>
            );
        }
        
        case 'paragraph': {
            const paragraphToken = element as Tokens.Paragraph;
            return (
                <Box key={Math.random()}>
                    <Text color={baseColor} dimColor={dimmed}>
                        {paragraphToken.text}
                    </Text>
                </Box>
            );
        }

        case 'code': {
            const codeToken = element as Tokens.Code;
            return (
                <Box key={Math.random()} marginLeft={2}>
                    <Text color="yellow" dimColor={dimmed}>
                        {codeToken.text}
                    </Text>
                </Box>
            );
        }

        case 'blockquote': {
            const quoteToken = element as Tokens.Blockquote;
            return (
                <Box key={Math.random()} marginLeft={1}>
                    <Text color="blue" dimColor={dimmed}>
                        ▍ {quoteToken.text}
                    </Text>
                </Box>
            );
        }

        case 'list': {
            const listToken = element as Tokens.List;
            return (
                <Box key={Math.random()} flexDirection="column">
                    {listToken.items.map((item: Tokens.ListItem, index: number) => (
                        <Box key={index}>
                            <Text color={baseColor} dimColor={dimmed}>
                                {listToken.ordered ? `${index + 1}. ` : '• '}{item.text}
                            </Text>
                        </Box>
                    ))}
                </Box>
            );
        }

        case 'hr':
            return (
                <Box key={Math.random()}>
                    <Text color={baseColor} dimColor={dimmed}>
                        ───────────────────
                    </Text>
                </Box>
            );

        case 'text': {
            const textToken = element as Tokens.Text;
            return textToken.text
                .replace(/\*\*(.+?)\*\*/g, (_, content) => `\x1b[1m${content}\x1b[22m`) 
                .replace(/\*(.+?)\*/g, (_, content) => `\x1b[3m${content}\x1b[23m`) 
                .replace(/`(.+?)`/g, (_, content) => `\x1b[33m${content}\x1b[39m`);
        }

        default:
            return '';
    }
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
    content, 
    baseColor = 'white',
    dimmed = false 
}) => {
    try {
        const tokens = marked.lexer(content);
        
        return (
            <Box flexDirection="column">
                {tokens.map((token, index) => (
                    <Box key={index}>
                        {renderMarkdownElement(token, baseColor, dimmed)}
                    </Box>
                ))}
            </Box>
        );
    } catch (error) {
        return (
            <Text color={baseColor} dimColor={dimmed}>
                {content}
            </Text>
        );
    }
}; 