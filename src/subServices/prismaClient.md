The insertion functions are written with pattern defined below :

(params:{param1: <T>, param2: <T>, paramN: <T>})
: Promise<{ success: Boolean, message?: string }>
{
    // sync validation with zod
        const validation = valid.userCreateSchema.safeParse(params);
    if (!validation.success) {
        return { success: false, message: "UNKNOWN_VALIDATION_ERROR" };
    }

    try{
    //async validation (ie. db queries to ensure user does not exisist) IF NEEDED
        
    //business logic

    }catch(err){
        //error validation
    }
};