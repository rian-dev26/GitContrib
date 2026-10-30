"""Export to PDF."""

from io import BytesIO
from datetime import datetime


def export_to_pdf(analysis_data: dict) -> bytes:
    """Export analysis to PDF format."""
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        
        # Create PDF in memory
        pdf_buffer = BytesIO()
        doc = SimpleDocTemplate(pdf_buffer, pagesize=letter)
        elements = []
        styles = getSampleStyleSheet()
        
        # Title
        title = Paragraph("<b>GitContrib Analysis Report</b>", styles['Title'])
        elements.append(title)
        elements.append(Spacer(1, 12))
        
        # Repository info
        repo_name = analysis_data.get("repo_name", "Unknown")
        gen_date = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        info_text = f"Repository: <b>{repo_name}</b><br/>Generated: {gen_date}"
        elements.append(Paragraph(info_text, styles['Normal']))
        elements.append(Spacer(1, 12))
        
        # Summary table
        summary = analysis_data.get("summary", {})
        summary_data = [
            ["Metric", "Value"],
            ["Total Commits", str(summary.get("total_commits", 0))],
            ["Total Contributors", str(summary.get("total_contributors", 0))],
            ["Total Lines Added", str(summary.get("total_lines_added", 0))],
            ["Total Lines Deleted", str(summary.get("total_lines_deleted", 0))],
        ]
        
        summary_table = Table(summary_data, colWidths=[250, 250])
        summary_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.beige),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(summary_table)
        elements.append(Spacer(1, 12))
        
        # Contributors heading
        elements.append(Paragraph("<b>Contributors</b>", styles['Heading2']))
        elements.append(Spacer(1, 6))
        
        # Contributors table
        contrib_header = ["Author", "Cluster", "Commits", "Active Days", "Lines +", "Lines -"]
        contrib_data = [contrib_header]
        
        for contrib in analysis_data.get("contributors", []):
            contrib_data.append([
                contrib.get("name", "")[:20],
                str(contrib.get("cluster", "")),
                str(contrib.get("total_commits", 0)),
                str(contrib.get("active_days", 0)),
                str(contrib.get("lines_added", 0)),
                str(contrib.get("lines_deleted", 0)),
            ])
        
        contrib_table = Table(contrib_data, colWidths=[80, 60, 60, 80, 80, 80])
        contrib_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), colors.grey),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, -1), 9),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
            ('BACKGROUND', (0, 1), (-1, -1), colors.lightgrey),
            ('GRID', (0, 0), (-1, -1), 1, colors.black),
        ]))
        
        elements.append(contrib_table)
        
        # Build PDF
        doc.build(elements)
        pdf_buffer.seek(0)
        return pdf_buffer.getvalue()
    
    except ImportError:
        # Fallback ke CSV jika reportlab tidak ada
        from app.export_csv import export_to_csv
        return export_to_csv(analysis_data)
