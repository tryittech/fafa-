import fetch from 'node-fetch'

const BASE_URL = 'http://localhost:5001/api'

// 測試函數
async function testAPI() {
  console.log('🧪 開始測試 API...\n')

  try {
    // 測試健康檢查
    console.log('1. 測試健康檢查...')
    const healthResponse = await fetch(`${BASE_URL}/health`)
    const healthData = await healthResponse.json()
    console.log('✅ 健康檢查:', healthData.status)
    console.log('')

    // 測試稅率資訊
    console.log('2. 測試稅率資訊...')
    const ratesResponse = await fetch(`${BASE_URL}/tax/rates`)
    const ratesData = await ratesResponse.json()
    console.log('✅ 稅率資訊:', ratesData.success ? '成功' : '失敗')
    if (ratesData.success) {
      console.log(`   找到 ${ratesData.data.length} 個稅率項目`)
    }
    console.log('')

    // 測試營業稅計算
    console.log('3. 測試營業稅計算...')
    const taxCalculationResponse = await fetch(`${BASE_URL}/tax/calculate-business-tax`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        monthlyRevenue: 100000,
        exemptions: [],
        deductions: []
      })
    })
    const taxCalculationData = await taxCalculationResponse.json()
    console.log('✅ 營業稅計算:', taxCalculationData.success ? '成功' : '失敗')
    if (taxCalculationData.success) {
      console.log(`   月營業額: ${taxCalculationData.data.monthlyRevenue.toLocaleString()} 元`)
      console.log(`   月營業稅: ${taxCalculationData.data.monthlyTax.toLocaleString()} 元`)
    }
    console.log('')

    // 測試稅務申報提醒
    console.log('4. 測試稅務申報提醒...')
    const remindersResponse = await fetch(`${BASE_URL}/tax/filing-reminders`)
    const remindersData = await remindersResponse.json()
    console.log('✅ 稅務申報提醒:', remindersData.success ? '成功' : '失敗')
    if (remindersData.success) {
      console.log(`   找到 ${remindersData.data.length} 個提醒項目`)
    }
    console.log('')

    // 測試稅務資源
    console.log('5. 測試稅務資源...')
    const resourcesResponse = await fetch(`${BASE_URL}/tax/resources`)
    const resourcesData = await resourcesResponse.json()
    console.log('✅ 稅務資源:', resourcesData.success ? '成功' : '失敗')
    if (resourcesData.success) {
      console.log(`   找到 ${resourcesData.data.length} 個資源項目`)
    }
    console.log('')

    // 測試系統資訊
    console.log('6. 測試系統資訊...')
    const systemInfoResponse = await fetch(`${BASE_URL}/settings/system-info`)
    const systemInfoData = await systemInfoResponse.json()
    console.log('✅ 系統資訊:', systemInfoData.success ? '成功' : '失敗')
    if (systemInfoData.success) {
      console.log(`   版本: ${systemInfoData.data.version}`)
      console.log(`   收入記錄: ${systemInfoData.data.database.incomeRecords}`)
      console.log(`   支出記錄: ${systemInfoData.data.database.expenseRecords}`)
    }
    console.log('')

    // 測試備份列表
    console.log('7. 測試備份列表...')
    const backupsResponse = await fetch(`${BASE_URL}/settings/backups`)
    const backupsData = await backupsResponse.json()
    console.log('✅ 備份列表:', backupsData.success ? '成功' : '失敗')
    if (backupsData.success) {
      console.log(`   找到 ${backupsData.data.length} 個備份檔案`)
    }
    console.log('')

    console.log('🎉 所有 API 測試完成！')

  } catch (error) {
    console.error('❌ API 測試失敗:', error.message)
    console.log('\n請確保後端伺服器正在運行 (npm start)')
  }
}

// 執行測試
testAPI() 