import {Model, Schema, model, ObjectId} from "mongoose";
import { hash, compare } from "bcrypt";


interface PasswordResetToken {
    owner: ObjectId;
    token: string;
    createdAt: Date;
}
interface Methods {
    compareToken(token: string): Promise<boolean>
}


const passwordResetTokenSchema = new Schema<PasswordResetToken, {}, Methods>({
    owner: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    token: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        expires: 3600,
        default: Date.now()
    }
});

passwordResetTokenSchema.pre('save', async function(next) {
    if (this.isModified('token')) {
        this.token = await hash(this.token, 10);
    }
    next();
});

passwordResetTokenSchema.methods.compareToken = async function(token: string) {
    return await compare(token, this.token);
}

export default model("PasswordResetToken", passwordResetTokenSchema) as Model<PasswordResetToken, {}, Methods>