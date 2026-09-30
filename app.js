const PDF_URL = "./ملف سجل التقييم للصف الأول الثانوي.pdf"; 

// الإحداثيات الدقيقة لشبكة الـ 50 خانة
const PAGE_DATA = {
    4: { posX: 508.61, posY: 795.92, stepY: 15.16, maxTextWidth: 148.7 },
    6: { posX: 566.1, posY: 794.87, stepY: 15.21, maxTextWidth: 159.15 },
    8: { posX: 559.45, posY: 809.71, stepY: 15.04, maxTextWidth: 157.72 },
    10: { posX: 549.94, posY: 797.25, stepY: 14.71, maxTextWidth: 131.12 },
    12: { posX: 583.2, posY: 790.22, stepY: 14.57, maxTextWidth: 142.05 },
    // الصفحات الفردية المتطابقة
    5: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
    7: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
    9: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 },
    11: { posX: 522.52, posY: 752.93, stepY: 13.55, maxTextWidth: 99.27 }
};

document.getElementById('generateBtn').addEventListener('click', generatePDF);

// دالة إنشاء صورة الاسم مع دعم خط النظام والخطوط الخارجية
async function createCellImageBytes(name, maxFontSize, boxWidth, cellHeight, fontFamily) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const scale = 4; // دقة فائقة لمنع التغويش

    canvas.width = boxWidth * scale;
    canvas.height = cellHeight * scale;
    ctx.scale(scale, scale);
    
    let fontSize = maxFontSize;
    const maxHeightConstraint = cellHeight * 0.85;
    
    if (fontSize > maxHeightConstraint) {
        fontSize = maxHeightConstraint;
    }
    
    // إذا لم يكن خط نظام، ننتظر تحميله بالكامل
    if (!fontFamily.includes('system-ui')) {
        try {
            await document.fonts.load(`bold ${fontSize}px '${fontFamily}'`);
        } catch (e) {
            console.warn("تعذر تحميل الخط بشكل استباقي:", e);
        }
    }

    ctx.font = `bold ${fontSize}px ${fontFamily}`;
    
    // تصغير تدريجي دقيق للأسماء الطويلة في الخانات الضيقة
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
    // التقاط الخط المختار أو الاعتماد على خط النظام الافتراضي كخيار أساسي
    const fontFamily = document.getElementById('fontFamily').value || 'system-ui, -apple-system, sans-serif';
    
    if (!namesText) {
        alert('يرجى إدخال أسماء الطلاب أولاً!');
        return;
    }

    statusEl.innerText = "جاري معالجة الخطوط وتوزيع الأسماء بدقة تامة... يرجى الانتظار";
    statusEl.style.color = "#4f46e5";

    try {
        await document.fonts.ready;

        const pdfResponse = await fetch(PDF_URL);
        if (!pdfResponse.ok) throw new Error("لم يتم العثور على ملف الـ PDF في المجلد.");
        const pdfBytes = await pdfResponse.arrayBuffer();

        const { PDFDocument } = PDFLib;
        const pdfDoc = await PDFDocument.load(pdfBytes);
        const pages = pdfDoc.getPages();

        const names = namesText.split('\n');
        const maxFontSize = parseFloat(document.getElementById('maxFontSize').value);

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

        statusEl.innerText = "تم انشاء السجل بنجاح";
        statusEl.style.color = "#10b981";

    } catch (error) {
        console.error(error);
        statusEl.innerText = "حدث خطا ما, كود الخطأ 01, تواصل مع المطور لحل المشكلة.";
        statusEl.style.color = "#ef4444";
    }
}