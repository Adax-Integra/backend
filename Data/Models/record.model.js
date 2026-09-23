import {supabase} from '../Config/supabase.js';

const RECORD_COLUMNS = `
    record_id,
    user_id,
    created_at
`;

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

        if (!data){
            const notFound = new Error('Record not found for this user');
            notFound.status=404;
            throw notFound;
        }

        return data;
    }
}

export default RecordModel;