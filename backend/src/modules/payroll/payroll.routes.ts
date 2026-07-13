import { Router } from 'express';
import { payrollController } from './payroll.controller.js';
import { authenticate, requireRole } from '../../middleware/auth.js';
import { validate } from '../../middleware/validate.js';
import { generatePayslipSchema, bulkGenerateSchema, updatePayslipSchema, salaryStructureSchema, overtimeSchema, overtimeApproveSchema, disputeSchema, disputeResolveSchema, resolveIncompletePunchSchema } from './payroll.validation.js';

const router = Router();

router.get('/my-payslips', authenticate, payrollController.getMyPayslips.bind(payrollController));
router.get('/my-payslips/:id/download', authenticate, payrollController.downloadPayslip.bind(payrollController));
router.get('/payslips', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.getPayslips.bind(payrollController));
router.post('/payslips/generate', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: generatePayslipSchema }), payrollController.generatePayslip.bind(payrollController));
router.post('/payslips/bulk-generate', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: bulkGenerateSchema }), payrollController.bulkGenerate.bind(payrollController));
router.put('/payslips/:id', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: updatePayslipSchema }), payrollController.updatePayslip.bind(payrollController));
router.post('/payslips/:id/finalize', authenticate, requireRole('ADMIN'), payrollController.finalizePayslip.bind(payrollController));
router.get('/salary-structure', authenticate, payrollController.getSalaryStructure.bind(payrollController));
router.put('/salary-structure', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: salaryStructureSchema }), payrollController.updateSalaryStructure.bind(payrollController));

router.get('/overtime', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.getOvertimeRequests.bind(payrollController));
router.get('/my-overtime', authenticate, payrollController.getMyOvertime.bind(payrollController));
router.post('/overtime', authenticate, validate({ body: overtimeSchema }), payrollController.requestOvertime.bind(payrollController));
router.put('/overtime/:id/approve', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: overtimeApproveSchema }), payrollController.approveOvertime.bind(payrollController));

router.get('/disputes', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.getDisputes.bind(payrollController));
router.get('/my-disputes', authenticate, payrollController.getMyDisputes.bind(payrollController));
router.post('/disputes', authenticate, validate({ body: disputeSchema }), payrollController.raiseDispute.bind(payrollController));
router.put('/disputes/:id/resolve', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: disputeResolveSchema }), payrollController.resolveDispute.bind(payrollController));

router.get('/exceptions/incomplete-punches', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.getIncompletePunches.bind(payrollController));
router.put('/exceptions/incomplete-punches/:id/resolve', authenticate, requireRole('ADMIN', 'HR_MANAGER'), validate({ body: resolveIncompletePunchSchema }), payrollController.resolveIncompletePunch.bind(payrollController));

router.get('/adjustments', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.getAdjustments.bind(payrollController));
router.post('/adjustments', authenticate, requireRole('ADMIN', 'HR_MANAGER'), payrollController.createAdjustment.bind(payrollController));

export default router;