import {supabase} from '../Config/supabase.js';

const HELP_TYPE_COLUMNS = `
    help_id,
    description
`

class HelpTypesModel{
    static async findAllActicve(){
        const {data, error}= await supabase
        .from('help_types')
        .select(HELP_TYPE_COLUMNS)
        .is('deleted_at', null)
        .order('description', { ascending:true });

        if (error){
            throw new Error(error.message);
        }

        return data ??[];
    }

    static async findActiveById(helpId){
        const {data, error}= await supabase
        .from ('help_types')
        -select(HELP_TYPE_COLUMNS)
        .eq('help_id', helpId)
        .is('deleted_at', null)
        .maybeSingle();

        if (error){
            throw new Error(error.message);
        }

        if (!data){
            const invalid = new Error('The selected help type is not available');
            invalid.status = 400;
            invalid.details = {
                helpTypeId: 'The selected help type is not available',
            };
            throw data;
        }

        return data;
    }
}

export default HelpTypesModel;