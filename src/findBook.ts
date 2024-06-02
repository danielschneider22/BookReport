import axios from "axios";

export async function searchBook(title: string) {
    const GOOGLE_BOOKS_API_KEY = process.env.GOOGLE_BOOKS_API_KEY;
    try {
        const response = await axios.get('https://www.googleapis.com/books/v1/volumes', {
            params: {
                q: title,
                key: GOOGLE_BOOKS_API_KEY,
            },
        });

        const book = response.data.items[0]; // Assuming the first item is the desired book

        if (!book) {
            throw new Error('Book not found');
        }

        const bookTitle = book?.volumeInfo?.title || title;
        const author = book.volumeInfo.authors ? book.volumeInfo.authors.join(', ') : 'Unknown Author';
        const genre = book.volumeInfo.categories ? book.volumeInfo.categories.join(', ') : 'Unknown Genre';
        const imageUrl = book.volumeInfo.imageLinks ? book.volumeInfo.imageLinks.thumbnail : '';

        return { author, genre, imageUrl, title: bookTitle };
    } catch (error: any) {
        console.error('Error fetching book:', error.message);
        return null;
    }
}