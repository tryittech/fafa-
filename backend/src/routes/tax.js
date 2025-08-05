import express from 'express';
import { body, validationResult } from 'express-validator';
const router = express.Router();
import { query, run, get } from '../utils/database.js';

/**
 * 獲取稅率資訊
 */
router.get('/rates', async (req, res) => {
  try {
    const rates = [
      {
        type: 'business_tax',
        name: '營業稅',
        rate: 0.05,
        description: '一般營業稅率 5%',
        applicable: '年營業額超過 8 萬元',
        exemptions: ['小規模營業人', '農產品銷售']
      },
      {
        type: 'income_tax',
        name: '營利事業所得稅',
        rate: 0.20,
        description: '營利事業所得稅率 20%',
        applicable: '年營業額超過 12 萬元',
        deductions: ['薪資費用', '租金費用', '水電費', '折舊費用']
      },
      {
        type: 'withholding_tax',
        name: '扣繳稅款',
        rate: 0.10,
        description: '各類所得扣繳率 10%',
        applicable: '給付薪資、租金、利息等',
        exceptions: ['小額給付免扣繳']
      }
    ];

    res.json({
      success: true,
      data: rates,
      message: '稅率資訊獲取成功'
    });
  } catch (error) {
    console.error('獲取稅率資訊錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取稅率資訊失敗',
      error: error.message
    });
  }
});

/**
 * 計算營業稅
 */
router.post('/calculate-business-tax', [
  body('monthlyRevenue').isFloat({ min: 0 }).withMessage('月營業額必須為正數'),
  body('exemptions').optional().isArray().withMessage('免稅項目必須為陣列'),
  body('deductions').optional().isArray().withMessage('扣除項目必須為陣列')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: errors.array()
      });
    }

    const { monthlyRevenue, exemptions = [], deductions = [] } = req.body;
    
    // 計算年營業額
    const annualRevenue = monthlyRevenue * 12;
    
    // 檢查是否為小規模營業人
    const isSmallBusiness = annualRevenue <= 80000;
    
    // 計算應稅營業額
    let taxableRevenue = monthlyRevenue;
    
    // 扣除免稅項目
    exemptions.forEach(exemption => {
      if (exemption.amount && exemption.amount > 0) {
        taxableRevenue -= exemption.amount;
      }
    });
    
    // 確保應稅營業額不為負數
    taxableRevenue = Math.max(0, taxableRevenue);
    
    // 計算營業稅
    const businessTaxRate = 0.05;
    const monthlyTax = taxableRevenue * businessTaxRate;
    const annualTax = monthlyTax * 12;
    
    // 計算申報頻率
    let filingFrequency = 'monthly';
    let filingDeadline = '次月 15 日前';
    
    if (isSmallBusiness) {
      filingFrequency = 'quarterly';
      filingDeadline = '次季 15 日前';
    }
    
    // 計算下期申報日期
    const now = new Date();
    const nextFilingDate = new Date(now);
    if (filingFrequency === 'monthly') {
      nextFilingDate.setMonth(now.getMonth() + 1);
      nextFilingDate.setDate(15);
    } else {
      nextFilingDate.setMonth(now.getMonth() + 3);
      nextFilingDate.setDate(15);
    }
    
    const result = {
      monthlyRevenue,
      annualRevenue,
      isSmallBusiness,
      taxableRevenue,
      businessTaxRate: businessTaxRate * 100 + '%',
      monthlyTax: Math.round(monthlyTax),
      annualTax: Math.round(annualTax),
      filingFrequency,
      filingDeadline,
      nextFilingDate: nextFilingDate.toISOString().split('T')[0],
      exemptions,
      deductions,
      calculationDate: new Date().toISOString()
    };
    
    // 儲存計算記錄
    await run(`
      INSERT INTO tax_calculations (
        calculation_type, 
        input_data, 
        result_data, 
        created_at
      ) VALUES (?, ?, ?, ?)
    `, [
      'business_tax',
      JSON.stringify(req.body),
      JSON.stringify(result),
      new Date().toISOString()
    ]);
    
    res.json({
      success: true,
      data: result,
      message: '營業稅計算完成',
      disclaimer: '此計算結果僅供參考，實際稅額請以國稅局核定為準'
    });
  } catch (error) {
    console.error('計算營業稅錯誤:', error);
    res.status(500).json({
      success: false,
      message: '計算營業稅失敗',
      error: error.message
    });
  }
});

/**
 * 計算營利事業所得稅
 */
router.post('/calculate-income-tax', [
  body('annualRevenue').isFloat({ min: 0 }).withMessage('年營業額必須為正數'),
  body('expenses').isArray().withMessage('費用項目必須為陣列'),
  body('depreciation').optional().isFloat({ min: 0 }).withMessage('折舊費用必須為正數')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: '輸入資料驗證失敗',
        errors: errors.array()
      });
    }

    const { annualRevenue, expenses = [], depreciation = 0 } = req.body;
    
    // 計算總費用
    const totalExpenses = expenses.reduce((sum, expense) => {
      return sum + (expense.amount || 0);
    }, 0) + depreciation;
    
    // 計算課稅所得額
    const taxableIncome = Math.max(0, annualRevenue - totalExpenses);
    
    // 檢查是否適用免稅
    const isExempt = annualRevenue <= 120000;
    
    // 計算營利事業所得稅
    const incomeTaxRate = 0.20;
    const incomeTax = isExempt ? 0 : taxableIncome * incomeTaxRate;
    
    // 計算有效稅率
    const effectiveTaxRate = annualRevenue > 0 ? (incomeTax / annualRevenue) * 100 : 0;
    
    const result = {
      annualRevenue,
      totalExpenses,
      depreciation,
      taxableIncome,
      isExempt,
      incomeTaxRate: incomeTaxRate * 100 + '%',
      incomeTax: Math.round(incomeTax),
      effectiveTaxRate: Math.round(effectiveTaxRate * 100) / 100,
      expenses,
      calculationDate: new Date().toISOString()
    };
    
    // 儲存計算記錄
    await run(`
      INSERT INTO tax_calculations (
        calculation_type, 
        input_data, 
        result_data, 
        created_at
      ) VALUES (?, ?, ?, ?)
    `, [
      'income_tax',
      JSON.stringify(req.body),
      JSON.stringify(result),
      new Date().toISOString()
    ]);
    
    res.json({
      success: true,
      data: result,
      message: '營利事業所得稅計算完成',
      disclaimer: '此計算結果僅供參考，實際稅額請以國稅局核定為準'
    });
  } catch (error) {
    console.error('計算營利事業所得稅錯誤:', error);
    res.status(500).json({
      success: false,
      message: '計算營利事業所得稅失敗',
      error: error.message
    });
  }
});

/**
 * 獲取稅務申報提醒
 */
router.get('/filing-reminders', async (req, res) => {
  try {
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();
    
    const reminders = [];
    
    // 營業稅申報提醒
    const businessTaxDeadline = new Date(currentYear, currentMonth, 15);
    const daysUntilBusinessTax = Math.ceil((businessTaxDeadline - now) / (1000 * 60 * 60 * 24));
    
    reminders.push({
      type: 'business_tax',
      name: '營業稅申報',
      deadline: businessTaxDeadline.toISOString().split('T')[0],
      daysUntil: daysUntilBusinessTax,
      status: daysUntilBusinessTax < 0 ? 'overdue' : daysUntilBusinessTax <= 7 ? 'urgent' : 'upcoming',
      description: '每月 15 日前申報上月營業稅',
      priority: daysUntilBusinessTax <= 7 ? 'high' : 'medium'
    });
    
    // 營利事業所得稅申報提醒（每年 5 月）
    if (currentMonth === 5) {
      const incomeTaxDeadline = new Date(currentYear, 5, 31);
      const daysUntilIncomeTax = Math.ceil((incomeTaxDeadline - now) / (1000 * 60 * 60 * 24));
      
      reminders.push({
        type: 'income_tax',
        name: '營利事業所得稅申報',
        deadline: incomeTaxDeadline.toISOString().split('T')[0],
        daysUntil: daysUntilIncomeTax,
        status: daysUntilIncomeTax < 0 ? 'overdue' : daysUntilIncomeTax <= 14 ? 'urgent' : 'upcoming',
        description: '每年 5 月 31 日前申報上年度營利事業所得稅',
        priority: daysUntilIncomeTax <= 14 ? 'high' : 'medium'
      });
    }
    
    // 扣繳憑單申報提醒（每年 1 月）
    if (currentMonth === 1) {
      const withholdingDeadline = new Date(currentYear, 1, 31);
      const daysUntilWithholding = Math.ceil((withholdingDeadline - now) / (1000 * 60 * 60 * 24));
      
      reminders.push({
        type: 'withholding',
        name: '扣繳憑單申報',
        deadline: withholdingDeadline.toISOString().split('T')[0],
        daysUntil: daysUntilWithholding,
        status: daysUntilWithholding < 0 ? 'overdue' : daysUntilWithholding <= 14 ? 'urgent' : 'upcoming',
        description: '每年 1 月 31 日前申報上年度扣繳憑單',
        priority: daysUntilWithholding <= 14 ? 'high' : 'medium'
      });
    }
    
    res.json({
      success: true,
      data: reminders,
      message: '稅務申報提醒獲取成功'
    });
  } catch (error) {
    console.error('獲取稅務申報提醒錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取稅務申報提醒失敗',
      error: error.message
    });
  }
});

/**
 * 獲取稅務計算歷史記錄
 */
router.get('/calculation-history', async (req, res) => {
  try {
    const { page = 1, limit = 10, type } = req.query;
    const offset = (page - 1) * limit;
    
    let whereClause = '';
    let params = [];
    
    if (type) {
      whereClause = 'WHERE calculation_type = ?';
      params.push(type);
    }
    
    const history = await query(`
      SELECT 
        id,
        calculation_type,
        input_data,
        result_data,
        created_at
      FROM tax_calculations
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(limit), offset]);
    
    const total = await get(`
      SELECT COUNT(*) as count
      FROM tax_calculations
      ${whereClause}
    `, params);
    
    res.json({
      success: true,
      data: {
        history: history.map(record => ({
          id: record.id,
          type: record.calculation_type,
          input: JSON.parse(record.input_data),
          result: JSON.parse(record.result_data),
          createdAt: record.created_at
        })),
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total: total.count,
          totalPages: Math.ceil(total.count / limit)
        }
      },
      message: '稅務計算歷史記錄獲取成功'
    });
  } catch (error) {
    console.error('獲取稅務計算歷史記錄錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取稅務計算歷史記錄失敗',
      error: error.message
    });
  }
});

/**
 * 獲取稅務相關資源連結
 */
router.get('/resources', async (req, res) => {
  try {
    const resources = [
      {
        category: 'official',
        name: '財政部稅務入口網',
        url: 'https://www.etax.nat.gov.tw',
        description: '官方稅務資訊查詢與申報系統',
        icon: '🏛️'
      },
      {
        category: 'official',
        name: '國稅局各區分局',
        url: 'https://www.ntbna.gov.tw',
        description: '各地區國稅局聯絡資訊與服務',
        icon: '📞'
      },
      {
        category: 'guide',
        name: '營業稅申報指南',
        url: 'https://www.etax.nat.gov.tw/etwmain/etw113w/etw113w01',
        description: '營業稅申報流程與注意事項',
        icon: '📋'
      },
      {
        category: 'guide',
        name: '營利事業所得稅申報指南',
        url: 'https://www.etax.nat.gov.tw/etwmain/etw113w/etw113w02',
        description: '營利事業所得稅申報流程與注意事項',
        icon: '📊'
      },
      {
        category: 'tool',
        name: '稅額試算工具',
        url: 'https://www.etax.nat.gov.tw/etwmain/etw113w/etw113w03',
        description: '官方稅額試算與申報工具',
        icon: '🧮'
      },
      {
        category: 'faq',
        name: '常見問題 FAQ',
        url: 'https://www.etax.nat.gov.tw/etwmain/etw113w/etw113w04',
        description: '稅務申報常見問題解答',
        icon: '❓'
      }
    ];
    
    res.json({
      success: true,
      data: resources,
      message: '稅務相關資源獲取成功'
    });
  } catch (error) {
    console.error('獲取稅務相關資源錯誤:', error);
    res.status(500).json({
      success: false,
      message: '獲取稅務相關資源失敗',
      error: error.message
    });
  }
});

export default router; 