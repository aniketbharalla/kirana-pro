export interface HsnSummaryItem {
  hsnCode: string;
  description: string;
  uqc: string;             // Unit Quantity Code (KGS, NOS, PAC, etc.)
  totalQty: number;
  totalValue: number;
  taxableValue: number;
  igstAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  cessAmount: number;
}

export interface GSTR1B2BInvoice {
  ctin: string;            // Customer GSTIN
  inv: Array<{
    inum: string;          // Invoice Number
    idt: string;           // Invoice Date (DD-MM-YYYY)
    val: number;           // Total Invoice Value
    pos: string;           // Place of Supply state code (e.g. "07", "27")
    itms: Array<{
      num: number;
      itm_det: {
        rt: number;        // Tax Rate (0, 5, 12, 18, 28)
        txval: number;     // Taxable Value
        iamt: number;      // IGST
        camt: number;      // CGST
        samt: number;      // SGST
        csamt: number;     // Cess
      };
    }>;
  }>;
}

export interface GSTR1B2CSItem {
  sply_ty: 'INTER' | 'INTRA';
  rt: number;
  txval: number;
  camt: number;
  samt: number;
  iamt: number;
  csamt: number;
}

export interface GSTR1ExportFormat {
  gstin: string;
  fp: string;              // Financial Period (MMYYYY, e.g. "102026")
  gt: number;              // Gross Turnover
  cur_gt: number;
  b2b: GSTR1B2BInvoice[];
  b2cs: GSTR1B2CSItem[];
  hsn: { data: HsnSummaryItem[] };
  doc_issue: {
    doc_det: Array<{
      doc_num: number;
      doc_typ: string;
      docs: Array<{
        from: string;
        to: string;
        totnum: number;
        canc: number;
        net_issue: number;
      }>;
    }>;
  };
}

export interface GSTTaxSummary {
  periodLabel: string;
  totalInvoices: number;
  totalTaxable: number;
  totalCgst: number;
  totalSgst: number;
  totalIgst: number;
  totalTax: number;
  totalGrossSales: number;
  b2bCount: number;
  b2bTaxable: number;
  b2bTax: number;
  b2cCount: number;
  b2cTaxable: number;
  b2cTax: number;
  hsnSummary: HsnSummaryItem[];
}
