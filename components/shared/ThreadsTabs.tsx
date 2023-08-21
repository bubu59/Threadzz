import { fetchUserPosts } from "@/lib/actions/user.actions"
import { redirect } from "next/navigation"
import ThreadCard from "../cards/ThreadCard"
import { any } from "zod"
import { fetchCommunityPosts } from "@/lib/actions/community.actions"

interface Props {
    currentUserId: string,
    accountId: string,
    accountType: string,
}

interface Results {
    name: string;
    image: string;
    id: string;
    threads: {
      _id: string;
      text: string;
      parentId: string | null;
      author: {
        name: string;
        image: string;
        id: string;
      };
      community: {
        id: string;
        name: string;
        image: string;
      } | null;
      createdAt: string;
      children: {
        author: {
          image: string;
        };
      }[];
    }[];
  }

const ThreadsTabs = async ({
    currentUserId,
    accountId,
    accountType,
}: Props) => {
    let results: Results

    if(accountType === 'Community') {
        results = await fetchCommunityPosts(accountId)
    } else {
        results = await fetchUserPosts(accountId)
    }
    

    if(!results) redirect('/')

  return (
    <div className="mt-9 flex flex-col gap-10">
        {results.threads.map((thread: any) => (
            <ThreadCard
                key={thread._id}
                id={thread._id}
                currentUserId={currentUserId}
                parentId={thread.parentId}
                content={thread.text}
                author={
                    accountType === 'User' 
                     ? { name: results.name, image: results.image, id: results.id }
                     : { name: thread.author.name, image: thread.author.image, id: thread.author.id}
                }
                community={thread.community}
                createdAt={thread.createdAt}
                comments={thread.children}
            />
        ))}
    </div>
  )
}

export default ThreadsTabs