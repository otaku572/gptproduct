/**
 * Detect headings (#, ##, ###) and build Table of Contents
 */
function extractTOC(text) {
    const lines = text.split('\n');
    const toc = [];
    const headingRegex = /^(#{1,6})\s+(.*)$/;

    lines.forEach((line, index) => {
        const match = line.match(headingRegex);
        if (match) {
            toc.push({
                level: match[1].length,
                text: match[2].trim(),
                line: index + 1
            });
        }
    });
    return toc;
}

/**
 * Split text into sections based on markers:
 * "User:", "Assistant:", "Decision:", "Action:"
 */
function splitSections(text) {
    const markers = [
        { label: 'User', regex: /^User:\s*/i },
        { label: 'Assistant', regex: /^Assistant:\s*/i },
        { label: 'Decision', regex: /^Decision:\s*/i },
        { label: 'Action', regex: /^Action:\s*/i }
    ];

    const lines = text.split('\n');
    const sections = [];
    let currentSection = null;

    lines.forEach((line, index) => {
        let foundMarker = false;
        for (const marker of markers) {
            if (marker.regex.test(line)) {
                if (currentSection) {
                    sections.push(currentSection);
                }
                currentSection = {
                    label: marker.label,
                    startIndex: index,
                    content: [line.replace(marker.regex, '')],
                    heading: line.trim()
                };
                foundMarker = true;
                break;
            }
        }

        if (!foundMarker && currentSection) {
            currentSection.content.push(line);
        } else if (!foundMarker && !currentSection) {
            // Handle text before first marker
            currentSection = {
                label: 'General',
                startIndex: index,
                content: [line],
                heading: 'Intro'
            };
        }
    });

    if (currentSection) {
        sections.push(currentSection);
    }

    // Finalize contents
    return sections.map(s => ({
        ...s,
        content: s.content.join('\n').trim()
    }));
}

module.exports = {
    extractTOC,
    splitSections
};
