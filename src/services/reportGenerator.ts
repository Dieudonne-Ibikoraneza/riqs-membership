import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

// ─── Helpers ─────────────────────────────────────────────────────────────────

const loadImage = async (src: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "Anonymous";
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } else {
        reject(new Error("Failed to get canvas context"));
      }
    };
    img.onerror = reject;
    img.src = src;
  });
};

function formatMemberClass(cls: string) {
  const map: Record<string, string> = {
    Fellow: "Fellow", Professional: "Professional", Technologist: "Technologist",
    Graduate: "Graduate", Associate: "Associate", Student: "Student",
    Visiting_Member: "Visiting Member",
    Firm_Local_Small: "Rwandan Small Firm", Firm_Local_Medium: "Rwandan Medium Firm",
    Firm_Local_Large: "Rwandan Large Firm", Firm_Foreign_Small: "Foreign Small Firm",
    Firm_Foreign_Medium: "Foreign Medium Firm", Firm_Foreign_Large: "Foreign Large Firm",
  };
  return map[cls] || cls || "N/A";
}

// ─── Report Generators ───────────────────────────────────────────────────────

/**
 * Generates the Membership Assessment Report To The Governing Council
 */
export const generateMembershipAssessmentPDF = async (members: any[], period: string) => {
  const doc = new jsPDF();
  
  let logoData = null;
  try {
    logoData = await loadImage("/riqs-logo-report.png");
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  // Categorize members
  const profPassed: any[] = [];
  const techPassed: any[] = [];
  const reapply: any[] = [];
  const absent: any[] = [];

  // For this generic export, we'll try to guess status or just list them all.
  // In a real scenario, the backend would provide exact assessment outcomes.
  members.forEach(m => {
    // Basic heuristics for this template demonstration
    if (m.status === "Suspended") {
      reapply.push(m);
    } else if (m.status === "Inactive") {
      absent.push(m);
    } else {
      const cat = formatMemberClass(m.membershipClass);
      if (cat === "Professional") profPassed.push(m);
      else if (cat === "Technologist") techPassed.push(m);
      else profPassed.push(m); // default
    }
  });

  const totalPassed = profPassed.length + techPassed.length;
  
  let y = 20;

  if (logoData) {
    doc.addImage(logoData, 'PNG', 15, 10, 40, 20, undefined, 'FAST');
    y = 35; // push text down
  }
  
  // Header
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("RWANDA INSTITUTE OF QUANTITY SURVEYORS (RIQS)", 15, y); y += 8;
  doc.text("LICENSING AND MEMBERSHIP COMMITTEE", 15, y); y += 8;
  doc.text("MEMBERSHIP ORAL ASSESSMENTS RESULTS", 15, y); y += 8;
  doc.text("REPORT TO THE GOVERNING COUNCIL", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Period: ${period === "all" ? "All Time" : period}`, 15, y); y += 12;

  // Divider
  doc.setLineWidth(0.5);
  doc.line(15, y, 195, y); y += 15;

  // 1. INTRODUCTION
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("1. INTRODUCTION", 15, y); y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const introText = `This report presents the outcomes of the membership oral assessments. The assessment was designed to evaluate candidates' technical expertise, professionalism, and alignment with the core values of RIQS, to determine their eligibility for professional membership.`;
  const splitIntro = doc.splitTextToSize(introText, 180);
  doc.text(splitIntro, 15, y); y += splitIntro.length * 6 + 10;

  // 2. ASSESSMENT OUTCOMES
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("2. ASSESSMENT OUTCOMES", 15, y); y += 10;

  doc.text("2.1. CANDIDATES WHO PASSED", 15, y); y += 8;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  const passText = `A total of ${profPassed.length} Professional candidates and ${techPassed.length} Technologist candidates demonstrated the required competencies and professionalism, meeting the criteria for RIQS membership.`;
  const splitPass = doc.splitTextToSize(passText, 180);
  doc.text(splitPass, 15, y); y += splitPass.length * 6 + 5;

  doc.setFont("helvetica", "bold");
  doc.text("LIST OF SUCCESSFUL CANDIDATES:", 15, y); y += 8;
  
  doc.text("Professional Category", 15, y); y += 6;
  doc.setFont("helvetica", "normal");
  profPassed.forEach((m, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. QS ${m.fullName || m.full_name || "Unknown"}`, 20, y); y += 6;
  });
  y += 4;

  doc.setFont("helvetica", "bold");
  doc.text("Technologist Category", 15, y); y += 6;
  doc.setFont("helvetica", "normal");
  techPassed.forEach((m, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. ${m.fullName || m.full_name || "Unknown"}`, 20, y); y += 6;
  });
  y += 10;

  // Check page space
  if (y > 230) { doc.addPage(); y = 20; }

  doc.setFont("helvetica", "bold");
  doc.text("2.2. CANDIDATES RECOMMENDED FOR REAPPLICATION", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  const reapplyText = `These candidates did not meet the required standards, and further preparation is recommended before they reapply.`;
  const splitReapply = doc.splitTextToSize(reapplyText, 180);
  doc.text(splitReapply, 15, y); y += splitReapply.length * 6 + 4;

  reapply.forEach((m, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. ${m.fullName || m.full_name || "Unknown"}`, 20, y); y += 6;
  });
  if (reapply.length === 0) {
    doc.text("None.", 20, y); y += 6;
  }
  y += 10;

  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("ABSENT CANDIDATES:", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  absent.forEach((m, i) => {
    if (y > 270) { doc.addPage(); y = 20; }
    doc.text(`${i + 1}. ${m.fullName || m.full_name || "Unknown"}`, 20, y); y += 6;
  });
  if (absent.length === 0) {
    doc.text("None.", 20, y); y += 6;
  }
  y += 10;

  // 3. OBSERVATIONS
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("3. OBSERVATIONS", 15, y); y += 8;
  
  doc.setFont("helvetica", "normal");
  const successRate = totalPassed > 0 ? Math.round((totalPassed / members.length) * 100) : 0;
  const obs1 = `SUCCESS RATE: A total of ${profPassed.length} Professional candidates and ${techPassed.length} Technologist candidates successfully passed the assessments. Passing rate of ${successRate}% is reflecting a strong pool of potential professionals.`;
  const splitObs1 = doc.splitTextToSize(obs1, 175);
  doc.text("•", 15, y);
  doc.text(splitObs1, 20, y); y += splitObs1.length * 6 + 2;

  const obs2 = `REAPPLICATION NEEDS: The candidates who did not pass need further development in understanding bidding documents, applying quantity surveying principles throughout the project lifecycle, and improving their case study presentations.`;
  const splitObs2 = doc.splitTextToSize(obs2, 175);
  doc.text("•", 15, y);
  doc.text(splitObs2, 20, y); y += splitObs2.length * 6 + 10;

  // 4. RECOMMENDATIONS
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.text("4. RECOMMENDATIONS TO THE GOVERNING COUNCIL", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  doc.text("Based on the assessment outcomes, the Licensing and Membership Committee recommends the following:", 15, y); y += 8;

  doc.setFont("helvetica", "bold");
  doc.text("4.1. APPROVAL OF MEMBERSHIP FOR PASSED CANDIDATES", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  const rec1 = `The Governing Council is requested to approve the membership of ${profPassed.length} Professional candidates and ${techPassed.length} Technologist candidates.`;
  const splitRec1 = doc.splitTextToSize(rec1, 180);
  doc.text(splitRec1, 15, y); y += splitRec1.length * 6 + 10;

  // Sign off
  y += 20;
  doc.setFont("helvetica", "bold");
  doc.text("PREPARED BY:", 15, y); y += 8;
  doc.text("Licensing and Membership Committee", 15, y); y += 8;
  doc.setFont("helvetica", "normal");
  doc.text(`On ${new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`, 15, y);

  doc.save(`RIQS_Membership_Assessment_Report_${new Date().getTime()}.pdf`);
};

/**
 * Generates the APC Assessments Report PDF (Multi-page oral examination format)
 */
export const generateApcAssessmentPDF = async (apcs: any[]) => {
  const doc = new jsPDF();
  
  let logoData = null;
  try {
    logoData = await loadImage("/riqs-logo-report.png");
  } catch (e) {
    console.error("Failed to load logo", e);
  }

  for (let i = 0; i < apcs.length; i++) {
    const apc = apcs[i];
    if (i > 0) {
      doc.addPage();
    }

    if (logoData) {
      doc.addImage(logoData, 'PNG', 15, 15, 40, 20, undefined, 'FAST');
    }

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Rwanda Institute of Quantity Surveyors (RIQS)", 100, 18);
    doc.text("BHC Building – 3rd Floor, KG 7 Ave 5", 100, 24);
    doc.text("Email: qsrwanda@gmail.com", 100, 30);
    doc.text("Website: www.rwandaiqs.com", 100, 36);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("ORAL EXAMINATION", 105, 48, { align: "center" });
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(`RIQS REGISTRATION ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" }).toUpperCase()}`, 105, 54, { align: "center" });

    doc.setFont("helvetica", "normal");
    const candidateName = apc.member?.fullName || apc.member?.full_name || apc.fullName || apc.full_name || "";
    doc.text(`CANDIDATE NAME:     ${candidateName}`, 15, 65);
    doc.text(`INDEX NUMBER:         ${i + 1}`, 15, 73);

    const score = apc.scorePercentage;
    const isPass = apc.status === "Passed" || (score && score >= 50);
    
    // Create the table
    autoTable(doc, {
      startY: 80,
      head: [["MARKS WEIGHTING", "DESCRIPTION", "COMMENTS", "MARKS AWARDED"]],
      body: [
        ["5", "Personality", "", ""],
        ["15", "Standard Bidding Documents", "", ""],
        ["35", "A general Overview of the FIDIC Red and Yellow Books", "", ""],
        ["35", "Standard Method of Measurement and Bill of Quantities", "", ""],
        ["10", "Submitted Case Study", "", ""],
        ["100", "TOTAL SCORING", "", score != null ? String(score) : ""],
      ],
      headStyles: { fillColor: [244, 199, 178], textColor: 0, fontStyle: "bold", halign: "center" },
      bodyStyles: { textColor: 0, minCellHeight: 12, valign: "middle" },
      columnStyles: {
        0: { halign: "center", cellWidth: 35 },
        1: { cellWidth: 80 },
        2: { cellWidth: 40 },
        3: { halign: "center", cellWidth: 35 }
      },
      theme: "grid",
    });

    const finalY = (doc as any).lastAutoTable.finalY + 15;

    doc.setFont("helvetica", "bold");
    doc.text("REMARK:", 25, finalY);
    doc.text('( Type YES "in appropriate Box")', 65, finalY);

    // Pass / Fail Boxes
    doc.text("PASS", 145, finalY);
    doc.rect(160, finalY - 4, 25, 7);
    if (isPass) {
      // Draw a Lucide-style checkmark
      doc.setLineWidth(1.2);
      doc.setLineCap('round');
      doc.setLineJoin('round');
      doc.line(167, finalY - 1, 171, finalY + 1.5);
      doc.line(171, finalY + 1.5, 179, finalY - 3.5);
      // Reset line width and cap for other elements
      doc.setLineWidth(0.2);
      doc.setLineCap('butt');
      doc.setLineJoin('miter');
    }

    doc.text("FAIL", 145, finalY + 10);
    doc.rect(160, finalY + 6, 25, 7);
    if (!isPass && apc.status) { // Only mark fail if explicitly failed
      doc.setLineWidth(1.2);
      doc.setLineCap('round');
      doc.setLineJoin('round');
      doc.line(167, finalY + 9, 171, finalY + 11.5);
      doc.line(171, finalY + 11.5, 179, finalY + 6.5);
      doc.setLineWidth(0.2);
      doc.setLineCap('butt');
      doc.setLineJoin('miter');
    }

    doc.setFont("helvetica", "bold");
    doc.text("EXAMINER'S NAME:", 50, finalY + 35);
    doc.setFont("helvetica", "normal");
    // List all panel chairs provided by the admin
    const examinersList = [apc.panelChairName, apc.examiner1Name, apc.examiner2Name].filter(Boolean).join(", ");
    const examinerName = examinersList || apc.examiner?.fullName || apc.panelChair || apc.assessorName || "";
    doc.text(examinerName, 95, finalY + 35);

    doc.setFont("helvetica", "bold");
    doc.text("DATE :", 50, finalY + 50);
    doc.setFont("helvetica", "normal");
    const dateStr = apc.assessmentDate ? new Date(apc.assessmentDate).toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString("en-GB", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
    doc.text(dateStr, 95, finalY + 50);
  }

  if (apcs.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.text("No APC assessments found.", 15, 20);
  }

  doc.save(`RIQS_APC_Assessments_${new Date().getTime()}.pdf`);
};

/**
 * Generates formatted Excel file with RIQS header
 */
export const generateFormattedExcel = async (filename: string, title: string, columns: string[], dataRows: any[][]) => {
  const ExcelJS = (await import('exceljs')).default || await import('exceljs');
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet("Report", { properties: { defaultRowHeight: 20 } });

  // Load Logo
  let logoId: number | undefined;
  try {
    const logoData = await loadImage("/riqs-logo-report.png");
    const base64Image = logoData.split(';base64,').pop() || '';
    logoId = wb.addImage({
      base64: base64Image,
      extension: 'png',
    });
  } catch (e) {
    console.error("Failed to load logo for excel", e);
  }

  if (logoId !== undefined) {
    // Add image over A1:B6 with padding
    ws.mergeCells('A1:B6');
    ws.addImage(logoId, {
      tl: { col: 0.2, row: 0.5 },
      ext: { width: 100, height: 80 }
    });
  }

  // Header Rows
  ws.getCell('C1').value = "Rwanda Institute of Quantity Surveyors (RIQS)";
  ws.getCell('C2').value = "BHC Building – 3rd Floor, KG 7 Ave 5";
  ws.getCell('C3').value = "Email: qsrwanda@gmail.com";
  ws.getCell('C4').value = "Website: www.rwandaiqs.com";
  ws.getCell('C5').value = "Kacyiru - Kigali - Rwanda";
  ws.getCell('C6').value = "Tel: +250788302519 / 0783772116 / 0786443477";

  // Merge & Style header
  for (let i = 1; i <= 6; i++) {
    ws.mergeCells(`C${i}:H${i}`);
    const cell = ws.getCell(`C${i}`);
    cell.font = { bold: i === 1, size: i === 1 ? 12 : 10 };
    cell.alignment = { vertical: 'middle', horizontal: 'left' };
  }

  ws.getCell('C8').value = title;
  ws.mergeCells('C8:H8');
  ws.getCell('C8').font = { bold: true, size: 12 };
  ws.getCell('C8').alignment = { vertical: 'middle', horizontal: 'left' };

  // Set dynamic column widths to prevent clipping
  ws.columns = columns.map((c) => {
    let width = 20;
    const name = c.toLowerCase();
    if (name === "no.") width = 8;
    else if (name.includes("id") || name === "ref") width = 25;
    else if (name.includes("name") || name.includes("member")) width = 35;
    else if (name.includes("email")) width = 40;
    else if (name.includes("category")) width = 35;
    else if (name.includes("honors") || name.includes("distinctions")) width = 45;
    else if (name.includes("location") || name.includes("status")) width = 20;
    return { width };
  });

  // Data table header (row 10)
  const headerRow = ws.getRow(10);
  headerRow.values = columns;
  headerRow.font = { bold: true, size: 11, color: { argb: 'FFFFFFFF' } };
  headerRow.alignment = { vertical: 'middle', horizontal: 'center' };
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1F3A8A' } // Tailwind blue-900
    };
    cell.border = {
      top: { style: 'thin' }, left: { style: 'thin' },
      bottom: { style: 'thin' }, right: { style: 'thin' }
    };
  });

  // Data Rows
  dataRows.forEach((rowData, index) => {
    const row = ws.addRow(rowData);
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin' }, left: { style: 'thin' },
        bottom: { style: 'thin' }, right: { style: 'thin' }
      };
      cell.alignment = { vertical: 'middle', horizontal: 'left' }; // Removed wrapText so it doesn't inflate row height unexpectedly
    });
  });

  // Trigger download
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  window.URL.revokeObjectURL(url);
};
