const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const { pool } = require('../../../config/db');

/**
 * Servicio para generar reportes de cuentas bancarias
 */
class BankAccountReportsService {

  /**
   * Generar reporte de saldos de cuentas bancarias
   */
  static async generateBalancesReport(filters = {}) {
    try {
      let query = `
        SELECT 
          ba.id,
          ba.account_number,
          ba.name as account_name,
          ba.bank_name,
          ba.account_type,
          ba.current_balance,
          ba.initial_balance,
          ba.is_active,
          c.code as currency_code,
          c.symbol as currency_symbol,
          c.name as currency_name,
          coa.code as gl_account_code,
          coa.name as gl_account_name,
          ba.created_at
        FROM bank_accounts ba
        LEFT JOIN currencies c ON ba.currency_id = c.id
        LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
        WHERE 1=1
      `;

      const params = [];

      // Aplicar filtros
      if (filters.account_type) {
        query += ` AND ba.account_type = ?`;
        params.push(filters.account_type);
      }

      if (filters.bank_name) {
        query += ` AND ba.bank_name LIKE ?`;
        params.push(`%${filters.bank_name}%`);
      }

      if (filters.is_active !== undefined) {
        query += ` AND ba.is_active = ?`;
        params.push(filters.is_active);
      }

      if (filters.currency_id) {
        query += ` AND ba.currency_id = ?`;
        params.push(filters.currency_id);
      }

      query += ` ORDER BY ba.bank_name, ba.account_number`;

      const [accounts] = await pool.execute(query, params);

      // Calcular totales por moneda
      const currencyTotals = accounts.reduce((acc, account) => {
        const currency = account.currency_code || 'COP';
        if (!acc[currency]) {
          acc[currency] = {
            currency_code: currency,
            currency_symbol: account.currency_symbol || '$',
            currency_name: account.currency_name || 'Pesos Colombianos',
            total_balance: 0,
            active_balance: 0,
            inactive_balance: 0,
            account_count: 0,
            active_count: 0,
            inactive_count: 0
          };
        }
        
        acc[currency].total_balance += parseFloat(account.current_balance || 0);
        acc[currency].account_count += 1;
        
        if (account.is_active) {
          acc[currency].active_balance += parseFloat(account.current_balance || 0);
          acc[currency].active_count += 1;
        } else {
          acc[currency].inactive_balance += parseFloat(account.current_balance || 0);
          acc[currency].inactive_count += 1;
        }
        
        return acc;
      }, {});

      const summary = Object.values(currencyTotals);

      return {
        success: true,
        data: {
          accounts,
          summary,
          total_accounts: accounts.length,
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error generando reporte de saldos: ${error.message}`);
    }
  }

  /**
   * Generar reporte de movimientos bancarios
   */
  static async generateMovementsReport(filters = {}) {
    try {
      let query = `
        SELECT 
          bt.id,
          bt.date,
          bt.transaction_type,
          bt.reference_number,
          bt.description,
          bt.amount,
          bt.running_balance,
          bt.status,
          bt.cleared_date,
          ba.account_number,
          ba.name as account_name,
          ba.bank_name,
          c.code as currency_code,
          c.symbol as currency_symbol,
          tp.name as third_party_name,
          tp.identification_number as third_party_id
        FROM bank_transactions bt
        INNER JOIN bank_accounts ba ON bt.bank_account_id = ba.id
        LEFT JOIN currencies c ON ba.currency_id = c.id
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        WHERE 1=1
      `;

      const params = [];

      // Aplicar filtros
      if (filters.date_from) {
        query += ` AND bt.date >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND bt.date <= ?`;
        params.push(filters.date_to);
      }

      if (filters.account_id) {
        query += ` AND ba.id = ?`;
        params.push(filters.account_id);
      }

      if (filters.transaction_type) {
        query += ` AND bt.transaction_type = ?`;
        params.push(filters.transaction_type);
      }

      if (filters.status) {
        query += ` AND bt.status = ?`;
        params.push(filters.status);
      }

      if (filters.bank_name) {
        query += ` AND ba.bank_name LIKE ?`;
        params.push(`%${filters.bank_name}%`);
      }

      query += ` ORDER BY bt.date DESC, ba.account_number, bt.id DESC`;

      const [transactions] = await pool.execute(query, params);

      // Calcular estadísticas
      const stats = {
        total_transactions: transactions.length,
        total_deposits: transactions.filter(t => ['deposit', 'receipt'].includes(t.transaction_type)).length,
        total_withdrawals: transactions.filter(t => ['withdrawal', 'payment'].includes(t.transaction_type)).length,
        total_transfers: transactions.filter(t => t.transaction_type === 'transfer').length,
        amount_by_type: transactions.reduce((acc, trans) => {
          const type = trans.transaction_type;
          if (!acc[type]) acc[type] = 0;
          acc[type] += parseFloat(trans.amount || 0);
          return acc;
        }, {}),
        status_distribution: transactions.reduce((acc, trans) => {
          const status = trans.status;
          if (!acc[status]) acc[status] = 0;
          acc[status] += 1;
          return acc;
        }, {})
      };

      return {
        success: true,
        data: {
          transactions,
          statistics: stats,
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error generando reporte de movimientos: ${error.message}`);
    }
  }

  /**
   * Generar reporte de flujo de caja por cuenta
   */
  static async generateCashFlowReport(filters = {}) {
    try {
      let query = `
        SELECT 
          ba.id as account_id,
          ba.account_number,
          ba.name as account_name,
          ba.bank_name,
          ba.initial_balance,
          ba.current_balance,
          c.code as currency_code,
          c.symbol as currency_symbol,
          DATE(bt.date) as transaction_date,
          SUM(CASE 
            WHEN bt.transaction_type IN ('deposit', 'receipt') THEN bt.amount 
            ELSE 0 
          END) as daily_inflows,
          SUM(CASE 
            WHEN bt.transaction_type IN ('withdrawal', 'payment', 'check') THEN bt.amount 
            ELSE 0 
          END) as daily_outflows,
          SUM(CASE 
            WHEN bt.transaction_type IN ('deposit', 'receipt') THEN bt.amount 
            WHEN bt.transaction_type IN ('withdrawal', 'payment', 'check') THEN -bt.amount 
            ELSE 0 
          END) as daily_net_flow
        FROM bank_accounts ba
        LEFT JOIN bank_transactions bt ON ba.id = bt.bank_account_id 
          AND bt.status = 'cleared'
        LEFT JOIN currencies c ON ba.currency_id = c.id
        WHERE ba.is_active = 1
      `;

      const params = [];

      // Aplicar filtros de fecha
      if (filters.date_from) {
        query += ` AND (bt.date >= ? OR bt.date IS NULL)`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        query += ` AND (bt.date <= ? OR bt.date IS NULL)`;
        params.push(filters.date_to);
      }

      if (filters.account_id) {
        query += ` AND ba.id = ?`;
        params.push(filters.account_id);
      }

      query += ` 
        GROUP BY ba.id, ba.account_number, ba.name, ba.bank_name, 
                 ba.initial_balance, ba.current_balance, 
                 c.code, c.symbol, DATE(bt.date)
        ORDER BY ba.bank_name, ba.account_number, transaction_date DESC
      `;

      const [cashFlowData] = await pool.execute(query, params);

      // Procesar datos para crear flujo de caja acumulado
      const accountsMap = new Map();
      
      cashFlowData.forEach(row => {
        const accountKey = row.account_id;
        if (!accountsMap.has(accountKey)) {
          accountsMap.set(accountKey, {
            account_info: {
              id: row.account_id,
              account_number: row.account_number,
              account_name: row.account_name,
              bank_name: row.bank_name,
              initial_balance: row.initial_balance,
              current_balance: row.current_balance,
              currency_code: row.currency_code,
              currency_symbol: row.currency_symbol
            },
            daily_flows: [],
            totals: {
              total_inflows: 0,
              total_outflows: 0,
              net_flow: 0
            }
          });
        }
        
        const accountData = accountsMap.get(accountKey);
        
        if (row.transaction_date) {
          accountData.daily_flows.push({
            date: row.transaction_date,
            inflows: parseFloat(row.daily_inflows || 0),
            outflows: parseFloat(row.daily_outflows || 0),
            net_flow: parseFloat(row.daily_net_flow || 0)
          });
          
          accountData.totals.total_inflows += parseFloat(row.daily_inflows || 0);
          accountData.totals.total_outflows += parseFloat(row.daily_outflows || 0);
          accountData.totals.net_flow += parseFloat(row.daily_net_flow || 0);
        }
      });

      const accounts = Array.from(accountsMap.values());

      return {
        success: true,
        data: {
          accounts,
          summary: {
            total_accounts: accounts.length,
            period_from: filters.date_from,
            period_to: filters.date_to
          },
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error generando reporte de flujo de caja: ${error.message}`);
    }
  }

  /**
   * Generar estado de cuenta bancaria específica
   */
  static async generateAccountStatement(accountId, filters = {}) {
    try {
      // Obtener información de la cuenta
      const [accountInfo] = await pool.execute(`
        SELECT 
          ba.*,
          c.code as currency_code,
          c.symbol as currency_symbol,
          c.name as currency_name,
          coa.code as gl_account_code,
          coa.name as gl_account_name
        FROM bank_accounts ba
        LEFT JOIN currencies c ON ba.currency_id = c.id
        LEFT JOIN chart_of_accounts coa ON ba.gl_account_id = coa.id
        WHERE ba.id = ?
      `, [accountId]);

      if (!accountInfo.length) {
        throw new Error('Cuenta bancaria no encontrada');
      }

      const account = accountInfo[0];

      // Obtener saldo inicial al período
      let initialBalanceQuery = `
        SELECT 
          COALESCE(
            (SELECT running_balance 
             FROM bank_transactions 
             WHERE bank_account_id = ? AND date < ? 
             ORDER BY date DESC, id DESC 
             LIMIT 1), 
            ?
          ) as initial_balance
      `;
      
      const [initialBalance] = await pool.execute(initialBalanceQuery, [
        accountId, 
        filters.date_from || '1900-01-01', 
        account.initial_balance
      ]);

      // Obtener transacciones del período
      let transactionsQuery = `
        SELECT 
          bt.*,
          tp.name as third_party_name,
          tp.identification_number as third_party_id
        FROM bank_transactions bt
        LEFT JOIN third_parties tp ON bt.third_party_id = tp.id
        WHERE bt.bank_account_id = ?
      `;

      const params = [accountId];

      if (filters.date_from) {
        transactionsQuery += ` AND bt.date >= ?`;
        params.push(filters.date_from);
      }

      if (filters.date_to) {
        transactionsQuery += ` AND bt.date <= ?`;
        params.push(filters.date_to);
      }

      transactionsQuery += ` ORDER BY bt.date ASC, bt.id ASC`;

      const [transactions] = await pool.execute(transactionsQuery, params);

      // Calcular estadísticas del período
      const periodStats = {
        opening_balance: parseFloat(initialBalance[0].initial_balance || 0),
        closing_balance: transactions.length > 0 ? 
          parseFloat(transactions[transactions.length - 1].running_balance || 0) : 
          parseFloat(initialBalance[0].initial_balance || 0),
        total_deposits: transactions
          .filter(t => ['deposit', 'receipt'].includes(t.transaction_type))
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        total_withdrawals: transactions
          .filter(t => ['withdrawal', 'payment', 'check'].includes(t.transaction_type))
          .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0),
        transaction_count: transactions.length,
        period_from: filters.date_from,
        period_to: filters.date_to
      };

      periodStats.net_movement = periodStats.total_deposits - periodStats.total_withdrawals;

      return {
        success: true,
        data: {
          account_info: account,
          period_statistics: periodStats,
          transactions,
          filters_applied: filters,
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error generando estado de cuenta: ${error.message}`);
    }
  }

  /**
   * Generar reporte consolidado de posición bancaria
   */
  static async generateConsolidatedReport(filters = {}) {
    try {
      const reportDate = filters.date || new Date().toISOString().split('T')[0];

      // Obtener posición consolidada por moneda
      const [consolidatedPosition] = await pool.execute(`
        SELECT 
          c.code as currency_code,
          c.symbol as currency_symbol,
          c.name as currency_name,
          COUNT(ba.id) as total_accounts,
          COUNT(CASE WHEN ba.is_active THEN 1 END) as active_accounts,
          SUM(ba.current_balance) as total_balance,
          SUM(CASE WHEN ba.is_active THEN ba.current_balance ELSE 0 END) as active_balance,
          SUM(CASE WHEN ba.account_type = 'checking' THEN ba.current_balance ELSE 0 END) as checking_balance,
          SUM(CASE WHEN ba.account_type = 'savings' THEN ba.current_balance ELSE 0 END) as savings_balance,
          SUM(CASE WHEN ba.account_type = 'credit' THEN ba.current_balance ELSE 0 END) as credit_balance,
          SUM(CASE WHEN ba.account_type = 'investment' THEN ba.current_balance ELSE 0 END) as investment_balance
        FROM bank_accounts ba
        INNER JOIN currencies c ON ba.currency_id = c.id
        GROUP BY c.id, c.code, c.symbol, c.name
        ORDER BY c.code
      `);

      // Obtener posición por banco
      const [bankPosition] = await pool.execute(`
        SELECT 
          ba.bank_name,
          COUNT(ba.id) as account_count,
          SUM(ba.current_balance) as total_balance,
          c.code as currency_code,
          c.symbol as currency_symbol
        FROM bank_accounts ba
        INNER JOIN currencies c ON ba.currency_id = c.id
        WHERE ba.is_active = 1
        GROUP BY ba.bank_name, c.id, c.code, c.symbol
        ORDER BY ba.bank_name, c.code
      `);

      // Obtener movimientos del día
      const [dailyMovements] = await pool.execute(`
        SELECT 
          bt.transaction_type,
          COUNT(*) as transaction_count,
          SUM(bt.amount) as total_amount,
          c.code as currency_code,
          c.symbol as currency_symbol
        FROM bank_transactions bt
        INNER JOIN bank_accounts ba ON bt.bank_account_id = ba.id
        INNER JOIN currencies c ON ba.currency_id = c.id
        WHERE DATE(bt.date) = ?
        GROUP BY bt.transaction_type, c.id, c.code, c.symbol
        ORDER BY bt.transaction_type, c.code
      `, [reportDate]);

      return {
        success: true,
        data: {
          report_date: reportDate,
          consolidated_by_currency: consolidatedPosition,
          position_by_bank: bankPosition,
          daily_movements: dailyMovements,
          summary: {
            total_currencies: consolidatedPosition.length,
            total_banks: [...new Set(bankPosition.map(b => b.bank_name))].length,
            total_accounts: consolidatedPosition.reduce((sum, c) => sum + c.total_accounts, 0),
            total_active_accounts: consolidatedPosition.reduce((sum, c) => sum + c.active_accounts, 0)
          },
          generated_at: new Date().toISOString()
        }
      };

    } catch (error) {
      throw new Error(`Error generando reporte consolidado: ${error.message}`);
    }
  }

  /**
   * Generar PDF para cualquier reporte (nuevo método que no guarda archivo)
   */
  static async generatePDFBuffer(reportData, reportType) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const buffers = [];

      // Recopilar chunks del PDF en memoria
      doc.on('data', buffers.push.bind(buffers));
      
      let pdfBuffer;
      const pdfPromise = new Promise((resolve) => {
        doc.on('end', () => {
          pdfBuffer = Buffer.concat(buffers);
          resolve(pdfBuffer);
        });
      });

      // Configurar fuentes y colores
      const primaryColor = '#1f2937';
      const secondaryColor = '#6b7280';
      const accentColor = '#3b82f6';

      // Encabezado del reporte
      doc.fontSize(20)
         .fillColor(primaryColor)
         .text('REPORTE DE CUENTAS BANCARIAS', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor(accentColor)
         .text(this.getReportTitle(reportType), { align: 'center' });

      doc.moveDown();

      // Información de generación
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(`Generado: ${new Date().toLocaleString('es-CO')}`, { align: 'right' });

      doc.moveDown();

      // Contenido específico según el tipo de reporte
      switch (reportType) {
        case 'balances':
          this.addBalancesContent(doc, reportData);
          break;
        case 'movements':
          this.addMovementsContent(doc, reportData);
          break;
        case 'cash-flow':
          this.addCashFlowContent(doc, reportData);
          break;
        case 'account-statement':
          this.addAccountStatementContent(doc, reportData);
          break;
        case 'consolidated':
        case 'currency-analysis':
          this.addConsolidatedContent(doc, reportData);
          break;
        default:
          doc.text('Tipo de reporte no reconocido');
      }

      doc.end();

      const buffer = await pdfPromise;
      const fileName = `${reportType}_${Date.now()}.pdf`;

      return {
        success: true,
        buffer,
        fileName,
        contentType: 'application/pdf'
      };

    } catch (error) {
      throw new Error(`Error generando PDF: ${error.message}`);
    }
  }

  /**
   * Generar PDF para cualquier reporte (método original - guarda archivo)
   */
  static async generatePDF(reportData, reportType) {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const fileName = `${reportType}_${Date.now()}.pdf`;
      const filePath = path.join(__dirname, '../../../uploads/reports', fileName);

      // Asegurar que el directorio existe
      const reportsDir = path.dirname(filePath);
      if (!fs.existsSync(reportsDir)) {
        fs.mkdirSync(reportsDir, { recursive: true });
      }

      doc.pipe(fs.createWriteStream(filePath));

      // Configurar fuentes y colores
      const primaryColor = '#1f2937';
      const secondaryColor = '#6b7280';
      const accentColor = '#3b82f6';

      // Encabezado del reporte
      doc.fontSize(20)
         .fillColor(primaryColor)
         .text('REPORTE DE CUENTAS BANCARIAS', { align: 'center' });
      
      doc.fontSize(16)
         .fillColor(accentColor)
         .text(this.getReportTitle(reportType), { align: 'center' });

      doc.moveDown();

      // Información de generación
      doc.fontSize(10)
         .fillColor(secondaryColor)
         .text(`Generado: ${new Date().toLocaleString('es-CO')}`, { align: 'right' });

      doc.moveDown();

      // Contenido específico según el tipo de reporte
      switch (reportType) {
        case 'balances':
          this.addBalancesContent(doc, reportData);
          break;
        case 'movements':
          this.addMovementsContent(doc, reportData);
          break;
        case 'cash-flow':
          this.addCashFlowContent(doc, reportData);
          break;
        case 'account-statement':
          this.addAccountStatementContent(doc, reportData);
          break;
        case 'consolidated':
        case 'currency-analysis':
          this.addConsolidatedContent(doc, reportData);
          break;
        default:
          doc.text('Tipo de reporte no reconocido');
      }

      doc.end();

      return {
        success: true,
        fileName,
        filePath,
        url: `/api/files/reports/${fileName}`
      };

    } catch (error) {
      throw new Error(`Error generando PDF: ${error.message}`);
    }
  }

  // Métodos auxiliares para el PDF
  static getReportTitle(reportType) {
    const titles = {
      'balances': 'Reporte de Saldos',
      'movements': 'Reporte de Movimientos',
      'cash-flow': 'Reporte de Flujo de Caja',
      'account-statement': 'Estado de Cuenta',
      'consolidated': 'Reporte Consolidado',
      'currency-analysis': 'Análisis por Moneda',
      'transfers': 'Reporte de Transferencias',
      'reconciliations': 'Reporte de Conciliaciones'
    };
    return titles[reportType] || 'Reporte Bancario';
  }

  static addBalancesContent(doc, data) {
    // Resumen por moneda
    if (data.summary && data.summary.length > 0) {
      doc.fontSize(14).fillColor('#1f2937').text('Resumen por Moneda:', { underline: true });
      doc.moveDown(0.5);

      data.summary.forEach(currency => {
        doc.fontSize(12)
           .fillColor('#374151')
           .text(`${currency.currency_name} (${currency.currency_code}):`)
           .text(`  • Total cuentas: ${currency.account_count}`)
           .text(`  • Cuentas activas: ${currency.active_count}`)
           .text(`  • Saldo total: ${currency.currency_symbol} ${Number(currency.total_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`);
        doc.moveDown(0.3);
      });
    }

    // Lista de cuentas
    doc.addPage();
    doc.fontSize(14).fillColor('#1f2937').text('Detalle de Cuentas:', { underline: true });
    doc.moveDown(0.5);

    data.accounts.forEach(account => {
      doc.fontSize(10)
         .fillColor('#374151')
         .text(`${account.account_number} - ${account.account_name}`)
         .text(`Banco: ${account.bank_name} | Tipo: ${account.account_type}`)
         .text(`Saldo: ${account.currency_symbol || '$'} ${Number(account.current_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Estado: ${account.is_active ? 'Activa' : 'Inactiva'}`);
      doc.moveDown(0.5);
    });
  }

  static addMovementsContent(doc, data) {
    // Estadísticas
    doc.fontSize(14).fillColor('#1f2937').text('Estadísticas del Período:', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Total de transacciones: ${data.statistics.total_transactions}`)
       .text(`Depósitos: ${data.statistics.total_deposits}`)
       .text(`Retiros: ${data.statistics.total_withdrawals}`)
       .text(`Transferencias: ${data.statistics.total_transfers}`);

    doc.moveDown();

    // Lista de transacciones (primeras 50)
    doc.fontSize(14).fillColor('#1f2937').text('Detalle de Transacciones:', { underline: true });
    doc.moveDown(0.5);

    const transactionsToShow = data.transactions.slice(0, 50);
    transactionsToShow.forEach(trans => {
      doc.fontSize(9)
         .fillColor('#374151')
         .text(`${trans.date} | ${trans.account_number} - ${trans.bank_name}`)
         .text(`${trans.transaction_type.toUpperCase()} | Ref: ${trans.reference_number || 'N/A'}`)
         .text(`Monto: ${trans.currency_symbol || '$'} ${Number(trans.amount).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Descripción: ${trans.description || 'Sin descripción'}`);
      doc.moveDown(0.3);
    });

    if (data.transactions.length > 50) {
      doc.text(`... y ${data.transactions.length - 50} transacciones más`);
    }
  }

  static addCashFlowContent(doc, data) {
    doc.fontSize(14).fillColor('#1f2937').text('Flujo de Caja por Cuenta:', { underline: true });
    doc.moveDown(0.5);

    data.accounts.forEach(account => {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`${account.account_info.account_number} - ${account.account_info.account_name}`)
         .text(`Banco: ${account.account_info.bank_name}`)
         .text(`Ingresos totales: ${account.account_info.currency_symbol || '$'} ${Number(account.totals.total_inflows).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Egresos totales: ${account.account_info.currency_symbol || '$'} ${Number(account.totals.total_outflows).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Flujo neto: ${account.account_info.currency_symbol || '$'} ${Number(account.totals.net_flow).toLocaleString('es-CO', {minimumFractionDigits: 2})}`);
      doc.moveDown(0.5);
    });
  }

  static addAccountStatementContent(doc, data) {
    const account = data.account_info;
    const stats = data.period_statistics;

    // Información de la cuenta
    doc.fontSize(14).fillColor('#1f2937').text('Información de la Cuenta:', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Número de cuenta: ${account.account_number}`)
       .text(`Nombre: ${account.name}`)
       .text(`Banco: ${account.bank_name}`)
       .text(`Tipo: ${account.account_type}`)
       .text(`Moneda: ${account.currency_name} (${account.currency_code})`);

    doc.moveDown();

    // Estadísticas del período
    doc.fontSize(14).fillColor('#1f2937').text('Resumen del Período:', { underline: true });
    doc.moveDown(0.5);

    doc.fontSize(12)
       .fillColor('#374151')
       .text(`Período: ${stats.period_from || 'Inicio'} a ${stats.period_to || 'Hoy'}`)
       .text(`Saldo inicial: ${account.currency_symbol || '$'} ${Number(stats.opening_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
       .text(`Saldo final: ${account.currency_symbol || '$'} ${Number(stats.closing_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
       .text(`Total depósitos: ${account.currency_symbol || '$'} ${Number(stats.total_deposits).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
       .text(`Total retiros: ${account.currency_symbol || '$'} ${Number(stats.total_withdrawals).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
       .text(`Movimiento neto: ${account.currency_symbol || '$'} ${Number(stats.net_movement).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
       .text(`Número de transacciones: ${stats.transaction_count}`);

    doc.moveDown();

    // Transacciones
    doc.fontSize(14).fillColor('#1f2937').text('Detalle de Transacciones:', { underline: true });
    doc.moveDown(0.5);

    data.transactions.forEach(trans => {
      doc.fontSize(9)
         .fillColor('#374151')
         .text(`${trans.date} | ${trans.transaction_type.toUpperCase()}`)
         .text(`Ref: ${trans.reference_number || 'N/A'} | Estado: ${trans.status}`)
         .text(`Monto: ${account.currency_symbol || '$'} ${Number(trans.amount).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Saldo: ${account.currency_symbol || '$'} ${Number(trans.running_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`Descripción: ${trans.description || 'Sin descripción'}`);
      doc.moveDown(0.4);
    });
  }

  static addConsolidatedContent(doc, data) {
    doc.fontSize(14).fillColor('#1f2937').text('Posición Consolidada por Moneda:', { underline: true });
    doc.moveDown(0.5);

    data.consolidated_by_currency.forEach(currency => {
      doc.fontSize(12)
         .fillColor('#374151')
         .text(`${currency.currency_name} (${currency.currency_code}):`)
         .text(`  • Total cuentas: ${currency.total_accounts} (${currency.active_accounts} activas)`)
         .text(`  • Saldo total: ${currency.currency_symbol} ${Number(currency.total_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`)
         .text(`  • Saldo activo: ${currency.currency_symbol} ${Number(currency.active_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})}`);
      doc.moveDown(0.5);
    });

    doc.moveDown();

    // Posición por banco
    doc.fontSize(14).fillColor('#1f2937').text('Posición por Banco:', { underline: true });
    doc.moveDown(0.5);

    const bankGroups = data.position_by_bank.reduce((acc, bank) => {
      if (!acc[bank.bank_name]) {
        acc[bank.bank_name] = [];
      }
      acc[bank.bank_name].push(bank);
      return acc;
    }, {});

    Object.entries(bankGroups).forEach(([bankName, currencies]) => {
      doc.fontSize(12).fillColor('#374151').text(`${bankName}:`);
      currencies.forEach(currency => {
        doc.fontSize(10)
           .text(`  • ${currency.currency_code}: ${currency.currency_symbol} ${Number(currency.total_balance).toLocaleString('es-CO', {minimumFractionDigits: 2})} (${currency.account_count} cuentas)`);
      });
      doc.moveDown(0.3);
    });
  }
}

module.exports = BankAccountReportsService; 