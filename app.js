// قواعد بيانات الإحداثيات مع ربط كل مرحلة بملف الـ PDF الخاص بها
const RECORDS_CONFIG = {
    "first_secondary": {
        pdfUrl: "./سجل_الاول_الثانوي.pdf",
        pages: {
            3: { posX: 544.02, posY: 803.17, stepY: 14.84, maxTextWidth: 109.45 },
            4: { posX: 508.61, posY: 795.92, stepY: 15.16, maxTextWidth: 148.7 },
            5: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
            6: { posX: 566.1, posY: 794.87, stepY: 15.21, maxTextWidth: 159.15 },
            7: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
            8: { posX: 559.45, posY: 809.71, stepY: 15.04, maxTextWidth: 157.72 },
            9: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
            10: { posX: 549.94, posY: 797.25, stepY: 14.71, maxTextWidth: 131.12 },
            11: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
            12: { posX: 583.2, posY: 790.22, stepY: 14.57, maxTextWidth: 142.05 }
        }
    },
    "second_secondary_bac": {
        pdfUrl: "./سجل_الثاني_الثانوي_بكالوريا.pdf",
        pages: {
            3: { posX: 542.63, posY: 804.21, stepY: 14.85, maxTextWidth: 107.27 },
            4: { posX: 517.08, posY: 808.89, stepY: 15.31, maxTextWidth: 149.6 },
            5: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            6: { posX: 517.39, posY: 752.47, stepY: 13.55, maxTextWidth: 140.63 },
            7: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 98.44 },
            8: { posX: 514.71, posY: 752.07, stepY: 13.53, maxTextWidth: 140.63 },
            9: { posX: 522.21, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            10: { posX: 504.66, posY: 752.47, stepY: 13.55, maxTextWidth: 120.54 },
            11: { posX: 522.21, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            12: { posX: 552.21, posY: 752.47, stepY: 13.55, maxTextWidth: 130.59 }
        }
    },
    "second_secondary_general": {
        pdfUrl: "./سجل_الثاني_الثانوي_عام.pdf",
        pages: {
            3: { posX: 543.36, posY: 803.48, stepY: 14.88, maxTextWidth: 107.27 },
            4: { posX: 509.06, posY: 796.18, stepY: 15.16, maxTextWidth: 148.14 },
            5: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            6: { posX: 565.98, posY: 794.72, stepY: 15.2, maxTextWidth: 157.62 },
            7: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            8: { posX: 558.35, posY: 810.02, stepY: 15.06, maxTextWidth: 156.07 },
            9: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            10: { posX: 549.6, posY: 797.61, stepY: 14.72, maxTextWidth: 130.55 },
            11: { posX: 522.07, posY: 752.47, stepY: 13.55, maxTextWidth: 97.77 },
            12: { posX: 582.42, posY: 789.58, stepY: 14.55, maxTextWidth: 140.76 }
        }
    }
};

document.getElementById('generateBtn').addEventListener('click', generatePDF);

async function createCellImageBytes(name, maxFontSize, boxWidth, cellHeight, fontFamily) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 4;

    canvas.width = boxWidth * scale;
    canvas.height = cellHeight * scale;
    ctx.scale(scale, scale);
    
    let fontSize = maxFontSize;
    const maxHeightConstraint = cellHeight * 0.85;
    
    if (fontSize > maxHeightConstraint) {
        fontSize = maxHeightConstraint;
    }
    
    if (!fontFamily.includes('system-ui')) {
        try {
            await document.fonts.load(`bold ${fontSize}px '${fontFamily}'`);
        } catch (e) {
            console.warn("تحذير في تحميل الخط:", e);
        }
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    
    while ((ctx.measureText(name).width > boxWidth - 4 || fontSize > maxHeightConstraint) && fontSize > 5) {
        fontSize -= 0.5;
        ctx.font = `bold ${fontSize}px ${fontFamily}`;
    }

    ctx.fillStyle = 'black';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    ctx.direction = 'rtl';

    ctx.fillText(name, boxWidth - 2, cellHeight / 2);

    const dataUrl = canvas.toDataURL('image/png');
    return await fetch(dataUrl).then(res => res.arrayBuffer());
}

async function generatePDF() {
    const statusEl = document.getElementById('status');
    const namesText = document.getElementById('studentNames').value.trim();
    const recordType = document.getElementById('recordType').value;
    const fontFamily = document.getElementById('fontFamily').value || 'system-ui, -apple-system, sans-serif';
    
    if (!namesText) {
        alert('يرجى إدخال أسماء الطلاب أولاً!');
        return;
    }

    statusEl.innerText = "جاري المعالجة وتوزيع الأسماء بدقة...";
    statusEl.style.color = "#4f46e5";

    try {
        await document.fonts.ready;

        const currentRecord = RECORDS_CONFIG[recordType];
        const pdfResponse = await fetch(currentRecord.pdfUrl);
        if (!pdfResponse.ok) throw new Error("لم يتم العثور على ملف الـ PDF الخاص بهذا السجل في المجلد.");
        const pdfBytes = await pdfResponse.arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        const names = namesText.split('\n');
        const maxFontSize = parseFloat(document.getElementById('maxFontSize').value);
        const PAGE_DATA = currentRecord.pages;

        const cleanNames = [];
        for (let i = 0; i < names.length; i++) {
            let name = names[i].trim();
            if (name && i < 50) {
                cleanNames.push(name);
            }
        }

        for (const [pageNumStr, data] of Object.entries(PAGE_DATA)) {
            const pageIndex = parseInt(pageNumStr) - 1;
            if (pageIndex >= pages.length) continue;
            
            const page = pages[pageIndex];

            for (let i = 0; i < cleanNames.length; i++) {
                const cellHeight = data.stepY * 0.85;
                const cellTopY = data.posY - (i * data.stepY);
                const cellCenterY = cellTopY - (data.stepY / 2);

                const imgBytes = await createCellImageBytes(cleanNames[i], maxFontSize, data.maxTextWidth, cellHeight, fontFamily);
                const pngImage = await pdfDoc.embedPng(imgBytes);
                const imgDims = pngImage.scale(0.25);

                page.drawImage(pngImage, {
                    x: data.posX - imgDims.width,
                    y: cellCenterY - (imgDims.height / 2),
                    width: imgDims.width,
                    height: imgDims.height,
                });
            }
        }

        const pdfBytesOut = await pdfDoc.save();
        const blob = new Blob([pdfBytesOut], { type: "application/pdf" });
        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = "سجل_التقييم_مع_الأسماء.pdf";
        link.click();

        statusEl.innerText = "تم إنشاء وتوليد السجل بنجاح! 🎉";
        statusEl.style.color = "#10b981";

    } catch (error) {
        console.error(error);
        statusEl.innerText = "حدث خطأ. تأكد من رفع ملف الـ PDF بالاسم الصحيح في المجلد.";
        statusEl.style.color = "#ef4444";
    }
}