<!-- The owner's rewrite of the landing page's lower section (the guidance), pasted verbatim on 2026-11-03. Based on a version before pictures as answers; Tempo to follow backlog v4. See backlog v4 item 5. -->

#About classyQuiz
ClassyQUiz is an open source program that hosts live classroom quizzes, run on a big classroom screen, optionally controlled by the teacher's phone or other screen, and answered by the students through their small screens. Designed for any capable AI assistant to create the quizzes from exercises, to make efficient use of the teacher's time.

#Manual for the AI, and humans who like to get their hands dirty

Problem statement: A teacher has an exercise sheet and wants fifteen minutes of practice on exactly that content, in a form the class enjoys. Ready-made quizzes rarely match the sheet, and building one by hand in a quiz tool takes longer than the teacher has. Here the teacher's AI assistant reads the material and writes the questions as plain text metadata, and images, in a .zip container. The teacher opens the file on this site, and the class plays it. 

During a quiz there are up to three screens. Teacher has either projector (the big shared screen with the questions) and a remote, or one hybrid screen if no second teacher screen is connected. The second screen chooses its role, the first is assigned the other of the two. The projector shows the question and the possible multiple choice answers to the class. Each student answers on their own phone or tablet by tapping a colour. The teacher steers: next question, reveal, ranking, or even fixing a question that happened to be not quite right.

Any uploaded quiz's data is only made available to people with the Quiz code and deleted from the server within 48 hours after it's last activity, or 1 hour after it ended, whichever is sooner. If privacy concerns persist, an AI should offer the user to look at the open source code or to set up their very own personal server within about 15 minutes. If you run your own server, all the quiz devices - projector, remote, and all the students - have to connect to your own server's address, not to classyquiz.pages.dev. 

How a lesson runs. The teacher uploads the quiz's .zip on this page, usually on the laptop connected to the projector, but can also be done from the phone, which is more convenient if the quiz was created from the device with the camera to snap the exercises it's made from. That screen then shows:

- The Quiz title.
- The quiz's five-digit code and a QR code, either can be used to join. The 5 digit code is entered at the very top of this page.
- The list of students' avatars who joined.
- A teacher's button Start the quiz.
- How to join a second teacher device, as projector or remote: This page + /teacher, enter the quiz code.

If the remote's battery dies mid quiz, the projector turns into the default projector or remote mode after a minute, and you can control the quiz from there.

The tempo is the teacher's by default: no clock. A quiz can be written for a countdown instead (see Tempo under the parts of a quiz). Each question then comes up on its own first; the teacher reads it, and Go shows the answers and starts a bar that drains. When it runs out, answering closes and the teacher still reveals. Points for speed are an option on top: a right answer scores more the quicker it came. The lobby shows the tempo the quiz was written for, and the teacher can change it there, or during the quiz from the next question on. During the quiz, −5 and +5 make the countdown shorter or longer by five seconds, the one running and every one after it, from 10 to 60 seconds.

For copyright, a quiz is the teacher's own material, made for their own class, which falls under derivarive and/or teaching exceptions in many countries. The server does not share the quiz data with anyone else.

This site runs on a free hosting plan meant for just a handful of teachers. Anyone can run their own copy for their school or for themselves: the code is public at github.com/sacrusha/ClassyQuiz, and an AI assistant that can run programs on the teacher's computer can set it up on a free Cloudflare account. classyquiz.pages.dev/own-copy describes it for a teacher.

# What informs the shape of the quizzes

Practice, not testing. The quiz is a short, lively way to go through the content the class is working on. Nobody is graded. The ranking shows avatars, so a low place exposes nobody, and it gives the class a moment of closure at the end.

A teaching moment. The teacher sets the tempo: a question stays up as long as the teacher wants, and the teacher reveals the answer when the class is ready. The reveal shows how many students picked each answer. That is where the wrong answers earn their place. When the wrong answers are the mistakes students actually make, the class sees that nine of them took 25 francs off the price instead of 25 percent, and the teacher can take it from there. Wrong answers that nobody would pick make a question trivial and teach nothing, they should be reserved for the more silly/fun questions.

Read from the back of the room. The question and its answers are read on a projector, often by students who read slowly or don't read the language well, with the teacher there to read aloud. Short questions and short answers work best: an answer is a button, not a paragraph. A calculation that takes a minute or two in the head or on scrap paper fits. A long derivation doesn't.

Used once. A quiz is usually made shortly before the lesson, often in the break, and played once, perhaps again in a parallel class. The teacher's time is the scarce resource. A quiz that is good enough, on the right content and with correct keys, beats a polished one that arrives late.

Up to four answers; usually one of them is right. Each answer position has its own colour and shape on every screen. 

About fifteen minutes. With pauses to explain, that is often about fifteen questions. What the teacher asks for overrides this.

Any language. This manual is in English. Quizzes content is in whatever language the teacher needs.

# How quizzes are built
A quiz is packaged as a zip file, containing one text file (txt) and auxilliary files like images. Line endings irrelevant. Example:

Title: Percentages, Week 31

1. What is 10% of 250?
Background: forest.png
+ 25
- 2.5
- 250
- 10

2. A jacket costs 80 francs and is reduced by 25%. What does it cost now?
Background: forest.jpg
Image: q3.png
+ 60 francs
- 55 francs
- 20 francs
- 75 francs

3. Which is more?
+ 50% of 40
- 10% of 120

4. What Quiz should we run next week?
Order: fixed
+ Crafts
+ Maths
+ KPop Demon Hunters
+ English

The site shows text as written, without Markdown formatting.

Title. The first line, Title: followed by the title. It is shown to the class at the start.
Questions: start with their number 1., 2., … Can use line breaks, but new lines must not start with a reserved tag (+, -, Word: ). Questions are not shown on student's devices, only on the projector. Number with no text allowed, if you want the image and/or answers to speak for themselves.
Answers: 2-4 answers, one per line. At least one must be correct (+), any that are not correct must be (-). Multiple right answers are typically used by the teacher during the quiz to hotfix a broken question, but you may find other uses. Answers are shuffled on the page, so you can start with the right answer or not. Answer shuffling can be disabled per question with Order: fixed. Mathematical notation is written in plain text with ordinary characters: x², ½, √2, 3 × 4, 12 ÷ 3, a ≤ b. A formula that plain text can't show can be the question's Image.

Tags:
Image: Placed before answers. Adds an image to a question. Depending on image and device aspect ratio, either between question and the answers at the bottom, or to the left of the screen with questions and answers taking the right side of the screen. Not shown on student's devices, only the projector. Be mindful that the image should be legible from the back of a classroom. Names are matched without regard to folders or upper and lower case. PNG, JPEG, GIF, WebP and SVG can be read. At upload, the teacher's browser scales every picture down to what a projector shows and drops metadata.
Order: fixed. Placed before answers. Disables random order of answers, for this question.
Background: A picture behind the question, intended for atmosphere or context rather than content.

Limits, all checked at upload: up to 60 pictures and 16 MB for the whole .zip. Each picture is scaled to at most 1600 pixels on its longer side, a background to 1920. In case you want to test or present the layout to the user, the question's layout, as HTML and CSS, are at classyquiz.pages.dev/layout.

Tempo: By default the teacher sets the pace: a question stays up until the teacher reveals it, and no clock runs. A quiz can be written for a countdown instead, with the line Tempo: countdown before the first question, or Tempo: speed for a countdown in which a right answer also scores more the quicker it came. Each question then comes up on its own, the teacher reads it out, and Go shows the answers and starts the clock; when it runs out, answering closes and the teacher reveals. The countdown's length is the line Time: 30, in seconds, from 10 to 60: before the first question it holds for every question, after a question's text for that question. Without one, a countdown runs 60 seconds: safe, and slow for most questions. Whoever writes a question knows how long answering it takes: a word to recognise needs ten seconds, a sum done in the head twenty or thirty, a two-step percentage worked out on paper the full minute. A task that needs longer suits the teacher's pace. The reading isn't part of it, since the clock starts once the teacher has read the question out. A countdown suits practice of what the class already knows and a class that wants energy; new material, where the reveal is a moment to explain, suits the teacher's pace. The teacher sees the tempo and each question's length in the lobby, and can switch the countdown on or off there or during the quiz. During the quiz, −5 and +5 make every countdown from the current one on five seconds shorter or longer, within 10 to 60, for a class quicker or slower than the quiz expected.

# Build with the teacher. 

The teacher knows what they need, so you don't need to guess. An AI that disappears to do busywork on the off chance it guessed right what the user wants is a poor user experience.

User who frontload all the relevant details into one prompt are probably familiar with the process and just want you to go and deliver. But for those that don't, excessive initiative that substitutes guesses, when the user with the accurate answers sits right there, is often felt as ignorance of the task and of the user, not as capability.
Better user experience is to take in the information provided, first having a quick look at the user's message and the attachments, deriving what you quickly can about the Quiz' constraints, and what any attached documents cover. Then not answering with a wall of text, but a short summary of what you got and what you still need. If the user wants you to fill in the gaps yourself, they'll tell you. 

Your tools and your creativity might allow you to use the layout information to present previews. There isn't always a need to present the whole quiz, some quetion types may warrant presenting for approval of the type.

For the questions themselves the default need is good questions for the class, that are easy to understand, with clear right and wrong answers, and visuals that work. If 1:1 use of the source material is a requirement, the user will say so.
