import React from 'react';
import { Box, Text } from 'ink';

interface MarkdownRendererProps {
    content: string;
    baseColor?: string;
    dimmed?: boolean;
}

interface TextSegment {
    text: string;
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    color?: string;
}

const parseInlineMarkdown = (text: string): TextSegment[] => {
    const segments: TextSegment[] = [];
    let currentPos = 0;
    
    const patterns = [
        { regex: /\*\*([^*]+)\*\*/g, type: 'bold' },
        { regex: /\*([^*]+)\*/g, type: 'italic' },
        { regex: /`([^`]+)`/g, type: 'code' },
    ];
    
    const allMatches: Array<{ match: RegExpExecArray; type: string }> = [];
    
    patterns.forEach(({ regex, type }) => {
        let match;
        const regexCopy = new RegExp(regex.source, regex.flags);
        while ((match = regexCopy.exec(text)) !== null) {
            allMatches.push({ match, type });
        }
    });
    
    allMatches.sort((a, b) => a.match.index - b.match.index);
    
    for (const { match, type } of allMatches) {
        const matchStart = match.index;
        const matchEnd = match.index + match[0].length;
        
        if (matchStart < currentPos) continue;
        
        if (matchStart > currentPos) {
            segments.push({
                text: text.slice(currentPos, matchStart)
            });
        }
        
        const formattedText = match[1];
        segments.push({
            text: formattedText,
            bold: type === 'bold',
            italic: type === 'italic',
            code: type === 'code',
            color: type === 'code' ? 'yellow' : undefined
        });
        
        currentPos = matchEnd;
    }
    
    if (currentPos < text.length) {
        segments.push({
            text: text.slice(currentPos)
        });
    }
    
    return segments.length > 0 ? segments : [{ text }];
};

const InlineText: React.FC<{ segments: TextSegment[]; baseColor: string; dimmed: boolean }> = ({ 
    segments, 
    baseColor, 
    dimmed 
}) => {
    return (
        <>
            {segments.map((segment, index) => (
                <Text 
                    key={index}
                    color={segment.color || baseColor}
                    bold={segment.bold}
                    italic={segment.italic}
                    dimColor={dimmed}
                >
                    {segment.text}
                </Text>
            ))}
        </>
    );
};

const parseMarkdown = (content: string) => {
    const lines = content.split('\n');
    const elements: Array<{ type: string; content: string; level?: number; language?: string }> = [];
    let inCodeBlock = false;
    let codeBlockContent: string[] = [];
    let codeLanguage = '';
    
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        const trimmed = line.trim();
        
        if (trimmed.startsWith('```')) {
            if (!inCodeBlock) {
                inCodeBlock = true;
                codeLanguage = trimmed.substring(3).trim();
                codeBlockContent = [];
            } else {
                inCodeBlock = false;
                elements.push({ 
                    type: 'codeblock', 
                    content: codeBlockContent.join('\n'),
                    language: codeLanguage
                });
                codeBlockContent = [];
                codeLanguage = '';
            }
            continue;
        }

        if (inCodeBlock) {
            codeBlockContent.push(line);
            continue;
        }
        
        if (trimmed.startsWith('#')) {
            const level = trimmed.match(/^#+/)?.[0].length || 1;
            const text = trimmed.replace(/^#+\s*/, '');
            elements.push({ type: 'heading', content: text, level });
        } else if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
            const text = trimmed.replace(/^[-*]\s*/, '');
            elements.push({ type: 'list', content: text });
        } else if (trimmed.startsWith('> ')) {
            const text = trimmed.replace(/^>\s*/, '');
            elements.push({ type: 'blockquote', content: text });
        } else if (trimmed.match(/^-+$/) || trimmed.match(/^=+$/)) {
            elements.push({ type: 'hr', content: '───────────────────' });
        } else if (trimmed.length > 0) {
            elements.push({ type: 'paragraph', content: trimmed });
        }
    }
    
    if (inCodeBlock && codeBlockContent.length > 0) {
        elements.push({ 
            type: 'codeblock', 
            content: codeBlockContent.join('\n'),
            language: codeLanguage
        });
    }
    
    return elements;
};

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ 
    content, 
    baseColor = 'white',
    dimmed = false 
}) => {
    const elements = parseMarkdown(content);
    
    return (
        <Box flexDirection="column">
            {elements.map((element, index) => {
                const segments = parseInlineMarkdown(element.content);
                
                switch (element.type) {
                    case 'heading':
                        const headingColors = ['cyan', 'blue', 'magenta', 'green', 'yellow', 'red'];
                        const headingColor = headingColors[Math.min((element.level || 1) - 1, headingColors.length - 1)];
                        
                        return (
                            <Box key={index} marginBottom={1}>
                                <Text bold color={headingColor} dimColor={dimmed}>
                                    <InlineText segments={segments} baseColor={headingColor} dimmed={dimmed} />
                                </Text>
                            </Box>
                        );
                    
                    case 'codeblock':
                        return (
                            <Box key={index} marginY={1} flexDirection="column">
                                <Text color="gray" dimColor={dimmed}>
                                    ───────────────────
                                </Text>
                                <Box marginLeft={2} marginY={1} flexDirection="column">
                                    {element.content.split('\n').map((line, lineIndex) => (
                                        <Text key={lineIndex} color="yellow" dimColor={dimmed}>
                                            {line}
                                        </Text>
                                    ))}
                                </Box>
                                <Text color="gray" dimColor={dimmed}>
                                    ───────────────────
                                </Text>
                            </Box>
                        );
                    
                    
                    case 'list':
                        return (
                            <Box key={index} marginLeft={2}>
                                <Text color={baseColor} dimColor={dimmed}>• </Text>
                                <Box flexShrink={1}>
                                    <Text color={baseColor} dimColor={dimmed}>
                                        <InlineText segments={segments} baseColor={baseColor} dimmed={dimmed} />
                                    </Text>
                                </Box>
                            </Box>
                        );
                    
                    case 'blockquote':
                        return (
                            <Box key={index} marginLeft={1} marginBottom={1}>
                                <Text color="blue" dimColor={dimmed}>▍ </Text>
                                <Box flexShrink={1}>
                                    <Text color="blue" dimColor={dimmed}>
                                        <InlineText segments={segments} baseColor="blue" dimmed={dimmed} />
                                    </Text>
                                </Box>
                            </Box>
                        );
                    
                    case 'hr':
                        return (
                            <Box key={index} marginY={1}>
                                <Text color={baseColor} dimColor={dimmed}>
                                    {element.content}
                                </Text>
                            </Box>
                        );
                    
                    default:
                        return (
                            <Box key={index} marginBottom={1}>
                                <Text color={baseColor} dimColor={dimmed}>
                                    <InlineText segments={segments} baseColor={baseColor} dimmed={dimmed} />
                                </Text>
                            </Box>
                        );
                }
            })}
        </Box>
    );
}; 