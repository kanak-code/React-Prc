/* eslint-disable no-unused-vars */
import React, { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addPost, fetchPosts, fetchTags } from '../api/api'

const PostList = () => {
    const [page, setPage] = useState(1);
    const queryClient = useQueryClient();


    const { data: postData, isLoading, isError, error } = useQuery({
        queryKey: ['posts', { page }],
        queryFn: () => fetchPosts(page)
    });


    const { data: tagsData } = useQuery({
        queryKey: ['tags'],
        queryFn: fetchTags,
        staleTime: Infinity
    })

    const {
        mutate,
        isPending,
        isError: isPostError,
        reset,
    } = useMutation({
        mutationFn: addPost,
        retry: 2, //num of times it will retry before failing
        onMutate: async () => {
            //Can be used to cancel outgoing queries
            await queryClient.cancelQueries({ queryKey: ["posts"], exact: true });
        },
        onSuccess: () => {
            // Invalidate queries with a key that starts with `posts`
            queryClient.invalidateQueries({
                queryKey: ['posts']
            })
        }
    })

    const handleSubmit = (e) => {
        e.preventDefault();
        //? =========== Check it =============
        const formData = new FormData(e.target);

        const title = formData.get('title')

        const tags = Array.from(formData.keys()).filter((key) => formData.get(key) === 'on');

        if (!title || !tags) return;

        mutate({ id: postData?.data?.length + 1, title, tags });

        e.target.reset(); // reset form


    }

    return (
        <div className="container">

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Enter your post.."
                    className="postbox"
                    name="title"
                />

                <div className="tags">
                    {tagsData?.map((tag, index) => {
                        return (
                            <div key={index}>
                                <input name={tag} id={tag} type="checkbox" />
                                <label htmlFor={tag}>{tag}</label>
                            </div>
                        );
                    })}
                </div>

                <button disabled={isPending}>
                    {isPending ? "Posting..." : "Post"}
                </button>
            </form>

            {isLoading && <p>Loading...</p>}
            {isError && <p>{error?.message}</p>}
            {isPostError && <p onClick={reset}>Uneble to post</p>}
            {postData?.data?.map((post) => {
                return (
                    <div key={post.id} className="post">
                        <div>{post.title}</div>
                        {post.tags.map((tag) => {
                            return <span key={tag}>{tag}</span>;
                        })}
                    </div>
                );
            })}

            {/* Pagination */}
            <div className="pages">
                <button
                    onClick={() => setPage((oldPage) => Math.max(oldPage - 1, 0))}
                    disabled={!postData?.prev}
                >
                    Previous Page
                </button>

                <span>{page}</span>
                <button
                    onClick={() => setPage((oldPage) => oldPage + 1)}
                    disabled={!postData?.next}
                >
                    Next Page
                </button>
            </div>
        </div>
    )
}

export default PostList