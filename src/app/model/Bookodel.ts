export class bookModel { 
    bookcover: string = ''; 
    bookID: string = ''; 
    author: string = ''; 
    Quantity: number = 0;
    onLoan: number = 0;
    title: string = ''


    constructor(A:bookModel){
        this.Quantity = A.Quantity;
        this.author = A.author;
        this.title = A.title;
        this.bookID = A.bookID
    }

    

 }

 export class lendedBook  {
    book!: bookModel;
    user!: User;
    dateOut!: Date; 
    dateIn!: Date;
    
    constructor(A: lendedBook){
        this.book = A.book;
        this.user = A.user;
        this.dateOut = A.dateOut;
        this.dateIn = A.dateIn
    }

 }

 export class User{
     
    username: string = '';
    userID: string = '';
    profilepic: string = ''
 }