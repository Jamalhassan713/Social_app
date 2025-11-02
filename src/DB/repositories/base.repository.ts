import mongoose, { FilterQuery, Model, ProjectionType, QueryOptions, Types, UpdateQuery } from "mongoose";


export abstract class baseRepository<T> {

    constructor(private model: Model<T>) { }
    async createNewDocument(document: Partial<T>): Promise<T> {
        return await this.model.create(document)
    }
    async findOneDocument(filters: FilterQuery<T>, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
        return await this.model.findOne(filters, projection, options)
    }
    async findDocumentById(id: string | Types.ObjectId, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T | null> {
        return await this.model.findById(id, projection, options)
    }
    async findDocumentByIdAndUpdate(id: string | Types.ObjectId, updatedObject: UpdateQuery<T>, options?: QueryOptions<T>): Promise<T | null> {
        return await this.model.findByIdAndUpdate(id, updatedObject, options)
    }
    async updateOneDocument(filters: FilterQuery<T>, updatedObject: UpdateQuery<T>, options?: QueryOptions<T>) {
        return await this.model.findOneAndUpdate(filters, updatedObject, options)
    }
    // updateMultipleDocument() { }
    // findAndUpdateDocument() { }
    // deleteOneDocument() { }
    // deleteMultipleDocument() { }
    // findAndDeleteDocument() { }
    async updateMultipleDocument(filters: FilterQuery<T>, updatedObject: UpdateQuery<T>) {
        return await this.model.updateMany(filters, updatedObject);
    }

    async deleteOneDocument(filters: FilterQuery<T>) {
        return await this.model.deleteOne(filters);
    }

    async deleteMultipleDocument(filters: FilterQuery<T>) {
        return await this.model.deleteMany(filters);
    }

    async findAndDeleteDocument(filters: FilterQuery<T>) {
        return await this.model.findOneAndDelete(filters);
    }

    async findDocuments(filters: FilterQuery<T> = {}, projection?: ProjectionType<T>, options?: QueryOptions<T>): Promise<T[] | []> {
        return await this.model.find(filters, projection, options)
    }
}