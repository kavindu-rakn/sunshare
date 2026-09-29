/*
 * ============================================================================
 *  File        : generate-report.js
 *  Project     : SunShare - Smart Solar Microgrid Trading System
 *  Module      : SE4040 Enterprise Application Development - Assignment 1
 *  Part        : B - Report
 *  Author      : Ranathunga R A K N (IT22552860)
 *  Created     : 2026-09-29
 *  Description : Builds report/SunShare-Report.docx from the project itself:
 *                the docs/ Markdown files (rules, architecture, database, API,
 *                hosting, decisions, challenges, references, team sheets),
 *                the diagrams/ and screenshots/ PNGs, each member's own
 *                reflection (report/contributions/*.md) and ALL source code
 *                as text (appendix). Run:  cd report; npm run build
 *                (update-toc.ps1 then fills in the table of contents with Word).
 * ============================================================================
 */
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const {
  AlignmentType, BorderStyle, Document, Footer, Header, HeadingLevel, ImageRun, LevelFormat, Packer, PageBreak,
  PageNumber, PageOrientation, Paragraph, ShadingType, Table, TableCell, TableOfContents, TableRow, TextRun, WidthType,
} = require('docx');

const ROOT = path.resolve(__dirname, '..');
const DOCS = path.join(ROOT, 'docs');
const CONFIG = JSON.parse(fs.readFileSync(path.join(__dirname, 'report.config.json'), 'utf8'));
const OUTPUT = path.join(__dirname, 'SunShare-Report.docx');

// A4 page in twentieths of a point (DXA) with 2 cm margins.
const PAGE = { width: 11906, height: 16838, margin: 1134 };
const PORTRAIT_WIDTH = PAGE.width - 2 * PAGE.margin; // 9638 DXA = about 642 px
const LANDSCAPE_WIDTH = PAGE.height - 2 * PAGE.margin; // 14570 DXA = about 971 px
const DXA_PER_PX = 15; // 1 px at 96 dpi = 15 DXA
const COLORS = { navy: '0B1F33', teal: '0F766E', tealSoft: 'E6F4F2', amberSoft: 'FEF3C7', muted: '64748B', codeBg: 'F1F5F9' };

let listInstance = 0; // every numbered list restarts at 1
let figureNumber = 0;

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

// Reads a text file from the repository.
function read(file) {
  return fs.readFileSync(path.join(ROOT, file), 'utf8').replace(/\r\n/g, '\n');
}

// Width and height of a PNG file (read from its header), in pixels.
function pngSize(buffer) {
  return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
}

// Removes working notes that only make sense inside the team (e.g. "(YOU, once)").
function cleanText(text) {
  return text.replace(/<!--[\s\S]*?-->/g, '').replace(/\s*\(YOU[^)]*\)/g, '').replace(/<br\s*\/?>/g, ' ');
}

// Turns Markdown inline marks (**bold**, `code`, [text](url), *italic*) into Word text runs.
function inlineRuns(text, base = {}) {
  const runs = [];
  const pattern = /(`[^`]+`)|(\*\*[^*]+\*\*)|(\[[^\]]+\]\([^)]+\))|(\*[^*\s][^*]*\*)/g;
  let last = 0;
  let match;
  const clean = cleanText(text);
  while ((match = pattern.exec(clean)) !== null) {
    if (match.index > last) {
      runs.push(new TextRun({ ...base, text: clean.slice(last, match.index) }));
    }
    const token = match[0];
    if (match[1]) {
      runs.push(new TextRun({ ...base, text: token.slice(1, -1), font: 'Consolas', size: base.size ? base.size - 2 : 19, noProof: true }));
    } else if (match[2]) {
      runs.push(new TextRun({ ...base, text: token.slice(2, -2).replace(/`/g, ''), bold: true }));
    } else if (match[3]) {
      const [, label, url] = token.match(/\[([^\]]+)\]\(([^)]+)\)/);
      runs.push(new TextRun({ ...base, text: url.startsWith('http') ? `${label} (${url})` : label }));
    } else {
      runs.push(new TextRun({ ...base, text: token.slice(1, -1), italics: true }));
    }
    last = match.index + token.length;
  }
  if (last < clean.length) {
    runs.push(new TextRun({ ...base, text: clean.slice(last) }));
  }
  return runs;
}

// A normal paragraph of text (Markdown inline marks allowed).
function para(text, options = {}) {
  return new Paragraph({ children: inlineRuns(text, options.run || {}), spacing: { after: 120 }, ...options.paragraph });
}

// A heading that appears in the table of contents (level 1-3).
function heading(text, level) {
  const levels = [HeadingLevel.HEADING_1, HeadingLevel.HEADING_2, HeadingLevel.HEADING_3, HeadingLevel.HEADING_4];
  return new Paragraph({ heading: levels[Math.min(level, 4) - 1], children: inlineRuns(text) });
}

// Splits a Markdown table row into cells; a "|" inside `code` or written as "\|" is not a separator.
function splitRow(line) {
  const cells = [];
  let current = '';
  let inCode = false;
  const body = line.trim().replace(/^\|/, '').replace(/\|$/, '');
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '\\' && body[i + 1] === '|') {
      current += '|';
      i++;
    } else if (ch === '`') {
      inCode = !inCode;
      current += ch;
    } else if (ch === '|' && !inCode) {
      cells.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  cells.push(current.trim());
  return cells;
}

// Builds a Word table; column widths follow how much text each column holds.
function table(headerCells, rows, totalWidth = PORTRAIT_WIDTH, fontSize = 17) {
  const count = headerCells.length;
  const weight = headerCells.map((h, c) => {
    const lengths = [h, ...rows.map((r) => r[c] || '')].map((t) => cleanText(t).length);
    const longest = Math.max(...lengths);
    if (longest <= 14) {
      return longest + 2; // short values (ids, dates, roles) get a column wide enough not to wrap
    }
    return Math.min(60, Math.max(6, lengths.reduce((a, b) => a + b, 0) / lengths.length));
  });
  const sum = weight.reduce((a, b) => a + b, 0);
  const widths = weight.map((w) => Math.floor((w / sum) * totalWidth));
  widths[count - 1] += totalWidth - widths.reduce((a, b) => a + b, 0);
  const border = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  const borders = { top: border, bottom: border, left: border, right: border };
  // One table row; the header row is shaded and repeats at the top of every page.
  const makeRow = (cells, isHeader) => new TableRow({
    tableHeader: isHeader,
    children: widths.map((width, c) => new TableCell({
      width: { size: width, type: WidthType.DXA },
      borders,
      margins: { top: 40, bottom: 40, left: 80, right: 80 },
      shading: isHeader ? { fill: COLORS.tealSoft, type: ShadingType.CLEAR, color: 'auto' } : undefined,
      children: [new Paragraph({ children: inlineRuns(cells[c] || '', { size: fontSize, bold: isHeader || undefined }) })],
    })),
  });
  return new Table({
    width: { size: totalWidth, type: WidthType.DXA },
    columnWidths: widths,
    rows: [makeRow(headerCells, true), ...rows.map((r) => makeRow(r, false))],
  });
}

// One line of source code in the appendix (monospace, small, no spacing).
// noProof: Word must not spell-check code (red lines everywhere, and very slow on 14,000 lines).
function codeLine(text, size = 14) {
  return new Paragraph({
    children: [new TextRun({ text: text.replace(/\t/g, '    ') || ' ', font: 'Consolas', size, noProof: true })],
    spacing: { before: 0, after: 0, line: 240 },
  });
}

// A picture with a numbered caption underneath. maxWidth/maxHeight are in pixels.
// inTable: inside a table "keep with next" would glue the table rows together, so it is left off there.
function figure(file, caption, maxWidth = 640, maxHeight = 900, inTable = false) {
  const data = fs.readFileSync(path.join(ROOT, file));
  const size = pngSize(data);
  const scale = Math.min(maxWidth / size.width, maxHeight / size.height, 1);
  figureNumber++;
  return [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 120, after: 60 },
      keepNext: !inTable, // the caption stays on the same page as the picture
      children: [new ImageRun({ type: 'png', data, transformation: { width: Math.round(size.width * scale), height: Math.round(size.height * scale) } })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [new TextRun({ text: `Figure ${figureNumber}: `, bold: true, size: 18, color: COLORS.muted }), ...inlineRuns(caption, { size: 18, color: COLORS.muted })],
    }),
  ];
}

// A highlighted box telling the reader what still has to be filled in.
function placeholder(text) {
  return new Paragraph({
    spacing: { after: 160 },
    shading: { fill: 'FFF59D', type: ShadingType.CLEAR, color: 'auto' },
    children: [new TextRun({ text, italics: true, bold: true })],
  });
}

// ---------------------------------------------------------------------------
// Markdown to Word (headings, paragraphs, lists, tables, quotes, code blocks)
// ---------------------------------------------------------------------------

// Returns the Markdown under a heading, up to the next heading of the same or a higher level.
function section(markdown, headingStart) {
  const lines = markdown.split('\n');
  const start = lines.findIndex((l) => /^#{1,6}\s/.test(l) && l.replace(/^#+\s*/, '').startsWith(headingStart));
  if (start < 0) {
    throw new Error(`Heading not found: ${headingStart}`);
  }
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    const m = lines[i].match(/^(#+)\s/);
    if (m && m[1].length <= level) {
      end = i;
      break;
    }
  }
  return lines.slice(start + 1, end).join('\n');
}

// Converts a block of Markdown into Word paragraphs and tables.
// headingLevel = the report heading level that a Markdown "##" becomes; skipCode leaves out ``` blocks.
function markdown(md, { headingLevel = 3, tableWidth = PORTRAIT_WIDTH, skipCode = false } = {}) {
  const out = [];
  const lines = cleanText(md).split('\n');
  let i = 0;
  let paragraphLines = [];
  // Turns the lines collected so far into one paragraph (Markdown joins wrapped lines).
  const flush = () => {
    if (paragraphLines.length) {
      out.push(para(paragraphLines.join(' ').trim()));
      paragraphLines = [];
    }
  };
  let currentList = null;
  while (i < lines.length) {
    const line = lines[i];
    if (line.trim().startsWith('```')) {
      flush();
      const indent = line.length - line.trimStart().length; // a code block inside a list item is indented
      const code = [];
      i++;
      while (i < lines.length && !lines[i].trim().startsWith('```')) {
        code.push(lines[i].slice(Math.min(indent, lines[i].length - lines[i].trimStart().length)));
        i++;
      }
      i++;
      if (!skipCode) {
        code.forEach((c) => out.push(new Paragraph({
          children: [new TextRun({ text: c || ' ', font: 'Consolas', size: 16, noProof: true })],
          shading: { fill: COLORS.codeBg, type: ShadingType.CLEAR, color: 'auto' },
          spacing: { before: 0, after: 0 },
        })));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
      continue;
    }
    const headingMatch = line.match(/^(#{2,6})\s+(.*)/);
    if (headingMatch) {
      flush();
      out.push(heading(headingMatch[2], Math.min(4, headingLevel + headingMatch[1].length - 2)));
      i++;
      continue;
    }
    if (line.trim().startsWith('|')) {
      flush();
      const rows = [];
      while (i < lines.length && lines[i].trim().startsWith('|')) {
        rows.push(lines[i]);
        i++;
      }
      const cells = rows.filter((r) => !/^\|?\s*:?-{2,}/.test(r.trim().replace(/^\|/, ''))).map(splitRow);
      if (cells.length) {
        out.push(table(cells[0], cells.slice(1), tableWidth));
        out.push(new Paragraph({ spacing: { after: 120 }, children: [] }));
      }
      continue;
    }
    const bullet = line.match(/^(\s*)[-*]\s+(.*)/);
    const numbered = line.match(/^(\s*)\d+\.\s+(.*)/);
    if (bullet || numbered) {
      flush();
      const m = bullet || numbered;
      const level = Math.min(2, Math.floor(m[1].length / 2));
      if (numbered && level === 0 && currentList !== 'numbered') {
        listInstance++;
      }
      currentList = numbered ? 'numbered' : 'bullet';
      out.push(new Paragraph({
        children: inlineRuns(m[2]),
        numbering: numbered ? { reference: 'numbers', level, instance: listInstance } : { reference: 'bullets', level },
        spacing: { after: 60 },
      }));
      i++;
      continue;
    }
    currentList = line.trim() === '' ? null : currentList;
    if (line.startsWith('>')) {
      flush();
      out.push(new Paragraph({
        children: inlineRuns(line.replace(/^>\s?/, ''), { italics: true, color: '334155' }),
        border: { left: { style: BorderStyle.SINGLE, size: 12, color: COLORS.teal, space: 8 } },
        indent: { left: 240 },
        spacing: { after: 120 },
      }));
      i++;
      continue;
    }
    if (line.trim() === '' || /^-{3,}$/.test(line.trim())) {
      flush();
      i++;
      continue;
    }
    paragraphLines.push(line.trim());
    i++;
  }
  flush();
  return out;
}

// All rows of the first Markdown table that has a row starting with the given cell pattern.
function tableRows(md, firstCellPattern) {
  return md.split('\n').filter((l) => l.trim().startsWith('|')).map(splitRow).filter((cells) => firstCellPattern.test(cells[0]));
}

// ---------------------------------------------------------------------------
// Report chapters
// ---------------------------------------------------------------------------

// Cover page: title, module, team, links.
function coverPage() {
  const memberRows = CONFIG.members.map((m) => [m.part, m.name, m.it, m.area]);
  const video = CONFIG.videoUrl || '[video link - added after recording]';
  return [
    new Paragraph({ spacing: { before: 1800 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: '☀', size: 96, color: 'F59E0B' })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: 'SunShare', bold: true, size: 72, color: COLORS.navy })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: 'Smart Solar Microgrid Trading System', size: 36, color: COLORS.teal })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 600 }, children: [new TextRun({ text: CONFIG.subtitle, size: 26, color: COLORS.muted })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: CONFIG.module, bold: true, size: 24 })] }),
    new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 480 }, children: [new TextRun({ text: `${CONFIG.year}  ·  Submitted ${CONFIG.submitted}`, size: 22 })] }),
    table(['Part', 'Member', 'IT number', 'Responsible for'], memberRows, PORTRAIT_WIDTH, 20),
    new Paragraph({ spacing: { before: 480 }, alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Git repository: ', bold: true }), new TextRun(CONFIG.gitUrl)] }),
    new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: 'Video (≤ 5 min): ', bold: true }), new TextRun({ text: video, highlight: CONFIG.videoUrl ? undefined : 'yellow' })] }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// Table of contents (filled in by Word via update-toc.ps1).
function contentsPage() {
  return [
    new Paragraph({ children: [new TextRun({ text: 'Contents', bold: true, size: 32, color: COLORS.navy })], spacing: { after: 200 } }),
    new TableOfContents('Contents', { hyperlink: true, headingStyleRange: '1-2' }),
    new Paragraph({ children: [new PageBreak()] }),
  ];
}

// 1. Introduction.
function introduction() {
  return [
    heading('1. Introduction', 1),
    para('**SunShare** is a client-server system for trading solar energy on a neighbourhood microgrid. Homes with rooftop solar panels (**prosumers**) book time slots at microgrid **stations** either to drop off spare energy (**Sell**) or to charge from the station battery (**Buy**). **Backoffice officers** run the system from a web app, and **Grid Operators** manage stations and confirm energy transfers on site by scanning the prosumer\'s QR code with the mobile app.'),
    para('The system has three parts, exactly as the assignment asks:'),
    ...markdown([
      '- **Web service (FAT service)** - a C# ASP.NET Core Web API (.NET 10) hosted on Windows **IIS** with a **MongoDB** database. *All* business rules (R1-R18) live in its Services; the clients only show screens and call the API.',
      '- **Web app** - React + **Bootstrap 5**, hosted on IIS, for Backoffice officers and Grid Operators.',
      '- **Android app** - pure native Java + XML, **SQLite** for the login session and cached stations, Retrofit for the API, ZXing for QR codes and the **Google Maps** JavaScript API for the nearby-stations map. Used by prosumers and Grid Operators.',
    ].join('\n')),
    para(`**Git repository:** ${CONFIG.gitUrl} - ${commitSummary()}`),
    para('This report explains the requirements and business rules, the architecture (high-level, use case and data flow diagrams), the database design, the Web API, how the system is hosted, every user interface (screenshots), the design decisions, the challenges we met, each member\'s contribution with the AI disclosure, and the references. The complete source code is included as text in Appendix A.'),
    heading('1.1 Scenario', 2),
    para('Backoffice registers microgrid stations and keeps their operating schedules. Grid Operators (web and mobile) publish battery slot availability and monitor bookings. Prosumers register on the mobile app, wait for a Backoffice officer to activate them, then reserve slots up to 7 days ahead, change or cancel them at least 12 hours before, and see their history. When staff approve a booking, the app shows a secure QR code; at the station the Grid Operator scans it, the server verifies it and the operator finalizes the energy transfer.'),
  ];
}

// "118 commits in 22 pull requests" - from the Git history.
function commitSummary() {
  try {
    const commits = execSync('git rev-list --count HEAD', { cwd: ROOT }).toString().trim();
    const merges = execSync('git rev-list --merges --count HEAD', { cwd: ROOT }).toString().trim();
    return `${commits} commits, merged through ${merges} pull requests (one branch and pull request per build phase).`;
  } catch (e) {
    return 'developed with one branch and pull request per build phase.';
  }
}

// 2. Requirements and business rules (docs/01-SPEC.md).
function requirements() {
  const spec = read('docs/01-SPEC.md');
  return [
    heading('2. Requirements and business rules', 1),
    para('This chapter is the specification the whole team built against. Every rule is enforced in the Web API (FAT service); the web and Android apps only display the API\'s answer. In the code, each rule is marked with a `// RULE Rx:` comment.'),
    heading('2.1 Roles', 2), ...markdown(section(spec, '1. Roles')),
    heading('2.2 Permission matrix', 2), ...markdown(section(spec, '2. Permission matrix')),
    heading('2.3 Statuses', 2), ...markdown(section(spec, '3. Statuses')),
    heading('2.4 Business rules R1-R18', 2), ...markdown(section(spec, '4. Business rules')),
    heading('2.5 Dashboard and list definitions', 2), ...markdown(section(spec, '5. Dashboard and list definitions')),
  ];
}

// 3. Architecture (diagram 1 + docs/02-ARCHITECTURE.md).
function architecture() {
  const arch = read('docs/02-ARCHITECTURE.md');
  return [
    heading('3. System architecture', 1),
    ...figure('diagrams/01-high-level-architecture.png', 'High-level architecture - Android and web clients, the FAT Web API on IIS, MongoDB and Google Maps'),
    ...markdown(section(arch, '1. Big picture'), { skipCode: true }),
    heading('3.1 Technology stack', 2), ...markdown(section(arch, '2. Tech stack'), { headingLevel: 3 }),
    heading('3.2 How one request flows', 2), ...markdown(section(arch, '4. How one request flows')),
    heading('3.3 Authentication', 2), ...markdown(section(arch, '5. Auth flow')),
    heading('3.4 Error handling', 2), ...markdown(section(arch, '6. Error handling')),
    heading('3.5 Addresses and ports', 2), ...markdown(section(arch, '7. Addresses and ports')),
    heading('3.6 Time handling', 2), ...markdown(section(arch, '8. Time handling')),
    heading('3.7 SQLite on the phone', 2), ...markdown(section(arch, '9. SQLite on the phone')),
    heading('3.8 Security notes', 2), ...markdown(section(arch, '10. Security notes')),
  ];
}

// 4. Use case diagram.
function useCases() {
  return [
    heading('4. Use case diagram', 1),
    para('Three actors use SunShare. Backoffice officers and Grid Operators are both **Staff**, so they share the staff use cases (dashboard, approving bookings, managing slots, booking on behalf of a prosumer). Only Backoffice manages users, prosumers, activations and stations; only Grid Operators scan QR codes and finalize transfers. The letter after each use case is the Part that built it (A-D, see chapter 12). *Finalize energy transfer* always **includes** *Scan QR and verify*, and *Show booking QR code* **extends** *View bookings* when a booking is Approved.'),
    ...figure('diagrams/02-use-case.png', 'Use case diagram - actors, system boundary SunShare, include and extend relations', 640, 860),
  ];
}

// 5. Data flow diagrams (level 1 on its own landscape page).
function dataFlowLevel0() {
  return [
    heading('5. Data flow diagrams', 1),
    para('Notation: rectangle = external entity, circle = process, cylinder = data store. Level 0 shows SunShare as a single process and the data it exchanges with its users and with Google Maps.'),
    ...figure('diagrams/03-dfd-level-0.png', 'DFD level 0 (context diagram)'),
  ];
}

// DFD level 1 (landscape section).
function dataFlowLevel1() {
  return [
    heading('5.1 DFD level 1', 2),
    para('Level 1 splits the system into its six main processes - they match the API\'s Services - and shows which data store each reads and writes. D1-D4 are the MongoDB collections; D5 is the SQLite database on the phone.'),
    ...figure('diagrams/04-dfd-level-1.png', 'DFD level 1 - processes 1.0-6.0 and data stores D1-D5', 960, 560),
  ];
}

// 6. Database design (diagram 5 + docs/03-DATABASE.md).
function database() {
  const db = read('docs/03-DATABASE.md');
  const intro = db.split('\n').slice(2, 14).join('\n');
  return [
    heading('6. Database design (MongoDB)', 1),
    ...markdown(intro),
    ...figure('diagrams/05-database-collections.png', 'The four collections, their fields and references (one-to-many)', 560, 800),
    heading('6.1 Relationships', 2), ...markdown(section(db, 'Relationships'), { skipCode: true }),
    heading('6.2 Users', 2), ...markdown(section(db, '1. `Users`')),
    heading('6.3 SolarStationInfo', 2), ...markdown(section(db, '2. `SolarStationInfo`')),
    heading('6.4 EnergyBookingSlots', 2), ...markdown(section(db, '3. `EnergyBookingSlots`')),
    heading('6.5 EnergyReservations', 2), ...markdown(section(db, '4. `EnergyReservations`')),
    heading('6.6 Sample data', 2), ...markdown(section(db, '5. Sample data'), { headingLevel: 3 }),
    heading('6.7 Indexes', 2), ...markdown(section(db, '6. Indexes')),
  ];
}

// 7. Web API (docs/04-API.md).
function webApi() {
  const api = read('docs/04-API.md');
  return [
    heading('7. Web API', 1),
    para('The API has **37 endpoints**, all under `/api`, documented live with Swagger at `http://localhost:8080/swagger`. Every answer is JSON; every error is `{ "message": "..." }` with a friendly text. The **Who** column shows the roles allowed (BO = Backoffice, GO = Grid Operator, PR = Prosumer, Any = any logged-in user); the API checks the role from the JWT token on every call.'),
    ...markdown(section(api, 'Endpoints'), { headingLevel: 2 }),
    heading('7.1 Controllers and services', 2), ...markdown(section(api, 'Controller → service map')),
  ];
}

// 8. Hosting and deployment (docs/08-SETUP-AND-HOSTING.md).
function hosting() {
  const setup = read('docs/08-SETUP-AND-HOSTING.md');
  return [
    heading('8. Hosting and deployment', 1),
    para('The Web API and the web app are both hosted on Windows **IIS** on the same laptop (API site **SunShareApi** on port 8080, web site **SunShareWeb** on port 8081), with **MongoDB Community Server** running as a Windows service. Two PowerShell scripts in `scripts/` make the deployment reproducible: run them in an administrator PowerShell from the repository folder, as often as needed.'),
    para('**Needed once:** Windows IIS feature, the **ASP.NET Core Hosting Bundle 10**, **MongoDB Community Server** (service `MongoDB`), the **.NET 10 SDK** and **Node.js** (to build), and Android Studio for the mobile app.'),
    heading('8.1 MongoDB', 2), ...markdown(section(setup, '2. MongoDB quick check')),
    heading('8.2 Host the Web API on IIS', 2), ...markdown(section(setup, '3. Host the API on IIS')),
    heading('8.3 Host the web app on IIS', 2), ...markdown(section(setup, '4. Host the web app on IIS')),
    heading('8.4 Connecting the emulator and a real phone', 2), ...markdown(section(setup, '7. Demo networking')),
    heading('8.5 Fresh sample data', 2), ...markdown(section(setup, '8. Fresh data before the viva')),
    heading('8.6 Troubleshooting', 2), ...markdown(section(setup, '9. Troubleshooting')),
  ];
}

// What each extra Android screenshot shows (screens with more than one picture).
const SHOT_STATES = {
  'M05-map.png': 'markers, nearest first',
  'M05b-map-details.png': 'station details on tap',
  'M07-summary-created.png': 'after creating a booking',
  'M07b-summary-cancelled.png': 'after cancelling',
  'M08-bookings-current.png': 'Current tab',
  'M08b-history-search.png': 'History tab with a search',
};

// Screen captions from docs/05-SCREENS.md: file name -> { code, name, who, what, activity }.
// Android names come from the Activity class: "ProsumerHomeActivity" -> "Prosumer Home".
function screenCaptions() {
  const screens = read('docs/05-SCREENS.md');
  const captions = {};
  screens.split('\n').filter((l) => /^\| [WM]\d+ \|/.test(l)).forEach((line) => {
    const cells = splitRow(line);
    const isWeb = cells[0].startsWith('W');
    const rawName = cells[isWeb ? 2 : 1].replace(/\*\*/g, '').replace(/\s*\(.*\)$/, '');
    const name = isWeb ? rawName : rawName.replace(/Activity$/, '').replace(/([a-z])([A-Z])/g, '$1 $2');
    const who = cells[isWeb ? 3 : 2];
    const files = (cells[cells.length - 1].match(/`[^`]+\.png`/g) || []).map((f) => f.slice(1, -1));
    files.forEach((file) => {
      const state = SHOT_STATES[file] ? ` - ${SHOT_STATES[file]}` : '';
      const what = cells[isWeb ? 4 : 3].replace(/\s*\*\*Rubric:[^*]*\*\*/g, ''); // team planning notes stay out of the report
      captions[file] = { code: cells[0], name: name + state, screen: name, who, what, activity: isWeb ? '' : rawName };
    });
  });
  return captions;
}

// 9. User interfaces: every web page, then every Android screen (3 per row).
function userInterfaces() {
  const captions = screenCaptions();
  const out = [
    heading('9. User interfaces', 1),
    para('All screenshots were taken from the finished system with the seeded sample data: the web app from the IIS-hosted site (port 8081) at 1440 px wide, and the Android app on the emulator connected to the IIS-hosted API. Every screen is shown once.'),
    heading('9.1 Web app (Backoffice and Grid Operator)', 2),
  ];
  const webFiles = fs.readdirSync(path.join(ROOT, 'screenshots/web')).filter((f) => /^W\d+/.test(f)).sort();
  webFiles.forEach((file) => {
    const c = captions[file] || { code: '', name: file, who: '', what: '' };
    out.push(heading(`${c.code} ${c.name}`, 3));
    out.push(para(c.what, { run: { size: 19 }, paragraph: { keepNext: true } }));
    out.push(...figure(`screenshots/web/${file}`, `${c.code} ${c.name} - ${c.who}`, 640, 820));
  });
  out.push(heading('9.2 Android app (Prosumer and Grid Operator)', 2));
  out.push(para('Three screenshots per row; what each screen does is listed after the pictures.'));
  const mobileFiles = fs.readdirSync(path.join(ROOT, 'screenshots/mobile')).filter((f) => /^M\d+/.test(f)).sort();
  for (let i = 0; i < mobileFiles.length; i += 3) {
    const group = mobileFiles.slice(i, i + 3);
    const cellWidth = Math.floor(PORTRAIT_WIDTH / 3);
    const noBorder = { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' };
    out.push(new Table({
      width: { size: cellWidth * 3, type: WidthType.DXA },
      columnWidths: [cellWidth, cellWidth, cellWidth],
      rows: [new TableRow({
        children: [0, 1, 2].map((k) => new TableCell({
          width: { size: cellWidth, type: WidthType.DXA },
          borders: { top: noBorder, bottom: noBorder, left: noBorder, right: noBorder },
          children: group[k] ? figure(`screenshots/mobile/${group[k]}`, `${(captions[group[k]] || {}).code || ''} ${(captions[group[k]] || {}).name || group[k]}`, 190, 420, true) : [new Paragraph('')],
        })),
      })],
    }));
  }
  // One description per screen (a screen with two pictures is described once).
  out.push(heading('What each Android screen does', 3));
  const described = new Set();
  mobileFiles.forEach((file) => {
    const c = captions[file] || { code: file, screen: file, who: '', what: '', activity: '' };
    if (!described.has(c.code)) {
      described.add(c.code);
      out.push(para(`**${c.code} ${c.screen}** (\`${c.activity}\`, ${c.who}) - ${c.what}`, { run: { size: 17 }, paragraph: { spacing: { after: 50 } } }));
    }
  });
  return out;
}

// 10. Design decisions (docs/11-DECISIONS.md) - landscape section.
function decisions() {
  const md = read('docs/11-DECISIONS.md');
  const rows = tableRows(md, /^D\d+$/);
  const header = splitRow(md.split('\n').find((l) => /^\|\s*#\s*\|/.test(l)));
  return [
    heading('10. Design decisions', 1),
    para(`Every design decision was written down when it was made (${rows.length} decisions), with the alternatives we rejected and why. Later decisions sometimes replace earlier ones - for example the map plan changed from the native Google Maps SDK to the Maps JavaScript API after a test (D47, D51, D53).`),
    table(header, rows, LANDSCAPE_WIDTH, 15),
  ];
}

// 11. Challenges (docs/12-CHALLENGES.md) - landscape section.
function challenges() {
  const md = read('docs/12-CHALLENGES.md');
  const rows = tableRows(md, /^C\d+$/);
  const header = splitRow(md.split('\n').find((l) => /^\|\s*#\s*\|/.test(l)));
  return [
    heading('11. Challenges and reflection', 1),
    para(`These are the real problems we met while building SunShare (${rows.length} entries), what we did about them and what we learned. They were logged on the day they happened.`),
    table(header, rows, LANDSCAPE_WIDTH, 15),
  ];
}

// One member's reflection from report/contributions/*.md, or a highlighted "to be written" box.
function reflection(member) {
  const text = fs.readFileSync(path.join(__dirname, 'contributions', member.reflection), 'utf8').replace(/<!--[\s\S]*?-->/g, '').trim();
  if (!text || text === 'TODO') {
    return [placeholder(`[To be written by ${member.name} in their own words: the AI tools they used, what for, what they checked, changed or rejected, and what they learned - edit report/contributions/${member.reflection} and rebuild.]`)];
  }
  return text.split(/\n\s*\n/).map((p) => para(p.replace(/\n/g, ' ')));
}

// 12. Individual contributions + AI disclosure (docs/09-TEAM.md + docs/group-pack/*).
function contributions() {
  const team = read('docs/09-TEAM.md');
  const partRows = tableRows(team, /^\*\*[A-D] — /);
  const out = [
    heading('12. Individual contributions and AI disclosure', 1),
    para('The work was split into four Parts so that each member owns complete features end to end (API, web and Android), matching the individual marking scheme. Kvn (group lead) made every commit on GitHub; each commit that belongs to another member\'s Part carries a `Co-authored-by:` line naming that member.'),
    heading('12.1 Use of AI tools (shared statement)', 2),
    para('The group used **Claude Code** (Anthropic) as an AI coding assistant, driven by the group lead Ranathunga R A K N. It was used to turn the brief into a phased build plan and the project documents in `docs/`, to write the code phase by phase (API, web app, Android app), to test the running system (Swagger calls, browser, Android emulator), to draw the diagrams, to take the screenshots and to generate this report.'),
    para('How the AI output was controlled: the rules, names and screens were fixed in the documents first (`01-SPEC`, `02-ARCHITECTURE`, `03-DATABASE`, `04-API`, `05-SCREENS`) and the AI had to follow them; every phase was built on its own branch and merged through a pull request only after the group lead reviewed and tested it on the IIS-hosted build, the emulator and a real phone; every decision and problem was logged (chapter 10 and 11). Several AI suggestions were changed or rejected after testing - for example the map approach (D47, D51, D53) and the fixes in C3, C8, C9, C12 and C13. Each member\'s own statement follows in their section.'),
  ];
  CONFIG.members.forEach((member, index) => {
    const sheet = read(`docs/group-pack/${member.sheet}`);
    const row = partRows.find((r) => r[0].includes(`${member.part} —`)) || [];
    out.push(heading(`12.${index + 2} Part ${member.part} - ${member.name} (${member.it})`, 2));
    out.push(para(`**Area:** ${member.area}.`));
    if (row.length) {
      out.push(para(`**Features:** ${row[1]}`));
      out.push(para(`**Business rules:** ${row[2]}  ·  **Marking-scheme lines:** ${row[3]}`));
    }
    // The viva sheets talk to the member ("You own ..."); the report talks about them.
    out.push(para(`**Summary:** ${section(sheet, 'In one sentence').trim().replace(/^You own/, `${member.name} owns`)}`));
    out.push(heading('Files', 3));
    const files = section(sheet, 'Files').split('\n').filter((l) => !l.startsWith('>')).join('\n').replace(/✅\s*/g, '');
    out.push(...markdown(files));
    out.push(para(`**Commits:** ${commitsFor(member)}`));
    out.push(heading('AI tools used and personal reflection', 3));
    out.push(...reflection(member));
  });
  return out;
}

// Short commit statement for one member, from the Git history.
function commitsFor(member) {
  try {
    if (member.part === 'B') {
      return `all commits were made from ${member.name}'s GitHub account (see ${CONFIG.gitUrl}/commits/main); Part B commits have no co-author line.`;
    }
    const log = execSync('git log HEAD --format=%B', { cwd: ROOT, maxBuffer: 50 * 1024 * 1024 }).toString();
    const count = log.split('\n').filter((l) => l.startsWith(`Co-authored-by: ${member.name}`)).length;
    return `${count} commits carry "Co-authored-by: ${member.name}" (visible on GitHub under each commit).`;
  } catch (e) {
    return 'see the Git history.';
  }
}

// 13. References (docs/13-REFERENCES.md).
function references() {
  const md = read('docs/13-REFERENCES.md');
  const items = md.split('\n').filter((l) => /^\[\d+\]/.test(l.trim()));
  return [
    heading('13. References', 1),
    para('References are in IEEE style. Where code follows one of these sources, the code has a `// Reference:` comment next to it.'),
    ...items.map((item) => new Paragraph({ children: inlineRuns(item.trim(), { size: 20 }), spacing: { after: 100 }, indent: { left: 567, hanging: 567 } })),
  ];
}

// Appendix A: all source code as text, grouped by application.
function sourceCode() {
  const files = execSync('git ls-files', { cwd: ROOT }).toString().split('\n').filter(Boolean);
  const groups = [
    ['A.1 Web API (C#, ASP.NET Core)', (f) => /^api\/SunShare\.Api\/.*\.(cs|csproj|json|config)$/.test(f) && !/launchSettings/.test(f)],
    ['A.2 Web app (React + Bootstrap 5)', (f) => /^web\/(src\/.*\.(jsx?|css)|index\.html|vite\.config\.js|package\.json|public\/web\.config|\.env\.(development|production))$/.test(f)],
    ['A.3 Android app - Java', (f) => /^android\/app\/src\/main\/java\/.*\.java$/.test(f)],
    ['A.4 Android app - manifest, layouts, resources and map page', (f) => /^android\/app\/(src\/main\/(AndroidManifest\.xml|res\/(layout|values|xml)\/.*\.xml|assets\/.*\.html)|build\.gradle\.kts)$/.test(f)],
    ['A.5 Deployment scripts (PowerShell)', (f) => /^scripts\/.*\.ps1$/.test(f)],
  ];
  const out = [
    heading('Appendix A. Source code', 1),
    para(`The complete source code of SunShare, as text, in the same folder structure as the Git repository (${CONFIG.gitUrl}). Build output, downloaded packages and images are left out.`),
  ];
  groups.forEach(([title, test]) => {
    out.push(heading(title, 2));
    files.filter(test).sort().forEach((file) => {
      out.push(heading(file, 3));
      read(file).split('\n').forEach((line) => out.push(codeLine(line)));
    });
  });
  return out;
}

// ---------------------------------------------------------------------------
// Document
// ---------------------------------------------------------------------------

// Page settings shared by all sections; landscape swaps width and height inside docx.
function sectionProperties(landscape = false) {
  return {
    page: {
      size: { width: PAGE.width, height: PAGE.height, orientation: landscape ? PageOrientation.LANDSCAPE : PageOrientation.PORTRAIT },
      margin: { top: PAGE.margin, bottom: PAGE.margin, left: PAGE.margin, right: PAGE.margin },
    },
  };
}

// Small grey header and "Page x of y" footer.
function headerFooter() {
  return {
    headers: { default: new Header({ children: [new Paragraph({ alignment: AlignmentType.RIGHT, children: [new TextRun({ text: 'SunShare - SE4040 Assignment 1', size: 16, color: COLORS.muted })] })] }) },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: ['Page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES], size: 16, color: COLORS.muted })] })] }) },
  };
}

// Builds the whole report and saves it.
async function main() {
  // Three list levels (bullets or 1. 2. 3.), each indented a bit more.
  const numberingLevels = (format) => [0, 1, 2].map((level) => ({
    level,
    format,
    text: format === LevelFormat.BULLET ? ['•', '◦', '▪'][level] : `%${level + 1}.`,
    alignment: AlignmentType.LEFT,
    style: { paragraph: { indent: { left: 540 + level * 360, hanging: 300 } } },
  }));
  const doc = new Document({
    creator: 'SunShare group',
    title: CONFIG.title,
    description: CONFIG.module,
    styles: {
      default: { document: { run: { font: 'Calibri', size: 21 } } },
      paragraphStyles: [
        { id: 'Heading1', name: 'Heading 1', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 34, bold: true, color: COLORS.navy }, paragraph: { spacing: { before: 360, after: 160 }, outlineLevel: 0, keepNext: true } },
        { id: 'Heading2', name: 'Heading 2', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 27, bold: true, color: COLORS.teal }, paragraph: { spacing: { before: 280, after: 120 }, outlineLevel: 1, keepNext: true } },
        { id: 'Heading3', name: 'Heading 3', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 23, bold: true, color: COLORS.navy }, paragraph: { spacing: { before: 200, after: 80 }, outlineLevel: 2, keepNext: true } },
        { id: 'Heading4', name: 'Heading 4', basedOn: 'Normal', next: 'Normal', quickFormat: true, run: { size: 21, bold: true, italics: true }, paragraph: { spacing: { before: 160, after: 60 }, outlineLevel: 3, keepNext: true } },
      ],
    },
    numbering: {
      config: [
        { reference: 'bullets', levels: numberingLevels(LevelFormat.BULLET) },
        { reference: 'numbers', levels: numberingLevels(LevelFormat.DECIMAL) },
      ],
    },
    sections: [
      { properties: sectionProperties(), children: [...coverPage(), ...contentsPage()] },
      { properties: sectionProperties(), ...headerFooter(), children: [...introduction(), ...requirements(), ...architecture(), ...useCases(), ...dataFlowLevel0()] },
      { properties: sectionProperties(true), ...headerFooter(), children: dataFlowLevel1() },
      { properties: sectionProperties(), ...headerFooter(), children: [...database(), ...webApi(), ...hosting(), ...userInterfaces()] },
      { properties: sectionProperties(true), ...headerFooter(), children: [...decisions(), new Paragraph({ children: [new PageBreak()] }), ...challenges()] },
      { properties: sectionProperties(), ...headerFooter(), children: [...contributions(), ...references()] },
      { properties: sectionProperties(), ...headerFooter(), children: sourceCode() },
    ],
  });
  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(OUTPUT, buffer);
  console.log(`Saved ${path.relative(ROOT, OUTPUT)} (${Math.round(buffer.length / 1024)} KB, ${figureNumber} figures)`);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
