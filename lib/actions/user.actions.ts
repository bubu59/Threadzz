"use server"

import { revalidatePath } from "next/cache"
import User from "../models/user.model"
import { connectToDB } from "../mongoose"
import Thread from "../models/thread.model"
import { FilterQuery, SortOrder } from "mongoose"

interface Params {
    userId: string,
    username: string,
    name: string,
    bio: string,
    image: string,
    path: string
}


export async function updateUser({
    userId,
    username,
    name,
    bio,
    image,
    path
}: Params): Promise<void> {
    connectToDB()

    try {
        await User.findOneAndUpdate(
            {id: userId},
            {
                username: username.toLowerCase(),
                name,
                bio,
                image,
                onboarded: true
            },
            { upsert: true }
        )
    
        if(path === '/profile/edit') {
            revalidatePath(path)
        }
    } catch (error: any) {
        throw new Error(`Failed to update user: ${error.message}`)
    } 
}

export async function fetchUser(userId: string) {
    try {
        connectToDB()

        return await User
            .findOne({id : userId})
                
    } catch (error:any) {
        throw new Error(`Failed to fetch user: ${error.message}`)
    }
}

export async function fetchUserPosts(userId: string) {
    try {
        connectToDB()

        const threads = await User.findOne({id: userId})
            .populate({
                path: 'threads',
                model: Thread,
                populate: {
                    path: 'children',
                    model: Thread,
                    populate: {
                        path: 'author',
                        model: User,
                        select: 'name image id'
                    }
                }
            })
        
        return threads
                
    } catch (error:any) {
        throw new Error(`Failed to fetch user posts: ${error.message}`)
    }
}

export async function fetchUsers({
    userId,
    searchString = "",
    pageNumber = 1,
    pageSize = 20,
    sortBy = "desc"
} : {
    userId: string,
    searchString?: string,
    pageNumber?: number,
    pageSize?: number,
    sortBy?: SortOrder
}) {    
    try {
        connectToDB()

        const skipAmount = (pageNumber - 1) * pageSize
        
        //does a case-insensitive search 
        const regex = new RegExp(searchString, "i")

        //selects the documents that does not equal to the specified field
        const query: FilterQuery<typeof User> = {
            id: { $ne: userId}
        }

        //selects documents that fulfill either requirements
        if(searchString.trim() !== '') {
            query.$or = [
                { username: { $regex: regex}},
                { name: { $regex: regex}}
            ]
        }

        //sort by time of creation of documents
        const sortOptions = { createdAt: sortBy}

        //the overall strucutre of the query 
        const userQuery = User.find(query)
            .sort(sortOptions)
            .skip(skipAmount)
            .limit(pageSize)
        
        //counts total no. of User documents, ie no. of users based on query
        const totalUsersCount = await User.countDocuments(query)

        //executes search function for query
        const users = await userQuery.exec()

        const isNext = totalUsersCount > skipAmount + users.length

        return { users, isNext}

    } catch (error:any) {
        throw new Error(`Failed to fetch users: ${error.message}`)
    }
}

export async function getActivity(userId: string) {
    try {
        connectToDB()

        //find all threads created by the user
        const userThreads = await Thread.find({ author: userId})

        //Collect all the child thread ids, ie replies, from the 'children' field
        const childThreadIds = userThreads.reduce((acc, userThread) => {
            return acc.concat(userThread.children)
        }, [])

        //Find me all the replies based on the childthread ids that are not of current user 
        // and also get the author's details of the childthreads
        const replies = await Thread.find({
            _id: { $in: childThreadIds},
            author: { $ne: userId }
        })
        .populate({
            path: 'author',
            model: User,
            select: 'name image _id'
        })

        return replies
    } catch (error:any) {
        throw new Error(`Failed to fetch user activity: ${error.message}`)
    }
}

