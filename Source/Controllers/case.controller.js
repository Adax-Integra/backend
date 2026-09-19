import GetCaseByIdUseCase from "../../domain/useCases/getCaseById.usecase";

const getCaseByIdUseCase = new GetCaseByIdUseCase();

class CaseController {
    async getCaseById(req, res) {
        try {
            const { caseId } = req.params;

            const data = await getCaseByIdUseCase.execute(caseId);

            return res.status(200).json({
                success: true,
                data: data,
            });
        } catch(e) {
            return res.status(400).json({
                success: false
            });
        }
    }
}

export default new CaseController();