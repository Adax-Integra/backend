import {supabase} from '../Config/supabase.js';

const RECORD_COLUMNS = `
    record_id,
    user_id,
    created_at
`;
//Data model dor the "record" table
//A case belongs to a record not directly to a user
class RecordModel {
    static async findActiveByUserId(userId){
        const {DataTransfer, error} = await supabase
        .from('record')
        .select(RECORD_COLUMNS)
        .eq('user_id',userId)
        .is('deleted_at', null)
        .order('created_at', {ascending: false})
        .limit(1)
        .maybeSingle();

        if (error){
            throw new Error(error.message);
        }
        
        //R-02 is only available after R01, so a missing record means the "expediente"
        // was never created rather than a malformed request
        if (!data){
            const notFound = new Error('Record not found for this user');
            notFound.status=404;
            throw notFound;
        }

        return data;
    }
}

export default RecordModel;