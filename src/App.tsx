import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useLayoutEffect,
} from "react";
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from "react-icons/bi";
import { MdOutlineArrowLeft, MdOutlineArrowRight } from "react-icons/md";

const fetchOptions = {
	headers: {
		"Content-Type": "application/json",
		Authorization: "Bearer andrewcbuensalida",
	},
};

function App() {
	const [text, setText] = useState<any>("");
	const [allMessages, setAllMessages] = useState<any>([]);
	const [currentTitle, setCurrentTitle] = useState<any>(null);
	const [isResponseLoading, setIsResponseLoading] = useState<any>(false);
	const [errorText, setErrorText] = useState<any>("");
	const [isShowSidebar, setIsShowSidebar] = useState<any>(false);
	const scrollToLastItem = useRef<any>(null);

	const currentMessages = allMessages.filter(
		(msg: any) => msg.title === currentTitle
	);
	const messagesToday = allMessages.filter(
		(msg: any) =>
			new Date(msg.createdAt).toDateString() === new Date().toDateString()
	);
	const messagesTodayUniqueTitles = Array.from(
		new Set(messagesToday.map((msg: any) => msg.title))
	).reverse();

	const messagesNotTodayUniqueTitles = Array.from(
		new Set(
			allMessages
				.map((msg: any) => msg.title)
				.filter(
					(title: any) => !messagesTodayUniqueTitles.includes(title)
				)
		)
	).reverse();

	const createNewChat = () => {
		setText("");
		setCurrentTitle(null);
	};

	const handleTitleClick = (uniqueTitle: any) => {
		setCurrentTitle(uniqueTitle);
		setText("");
	};

	const toggleSidebar = useCallback(() => {
		setIsShowSidebar((prev: any) => !prev);
	}, []);

	const submitHandler = async (e: any) => {
		e.preventDefault();

		if (!text) return;

		setIsResponseLoading(true);
		setErrorText("");

		try {
			const response = await fetch(
				`http://localhost:5000/api/completions`,
				{
					...fetchOptions,
					method: "POST",
					body: JSON.stringify({
						message: text,
						title: currentTitle,
					}),
				}
			);

			if (response.status === 429) {
				return setErrorText(
					"Too many requests, please try again later."
				);
			}

			const data = await response.json();

			if (data.error) {
				setErrorText(data.error.message);
				setText("");
			} else {
				setErrorText("");
			}

			if (!data.error) {
				setErrorText("");
				setTimeout(() => {
					scrollToLastItem.current?.lastElementChild?.scrollIntoView({
						behavior: "smooth",
					});
				}, 1);
				setTimeout(() => {
					setText("");
				}, 2);
				setAllMessages([...allMessages, data]);
				setCurrentTitle(data.title);
			}
		} catch (e: any) {
			setErrorText(e.message);
			console.error(e);
		} finally {
			setIsResponseLoading(false);
		}
	};

	useLayoutEffect(() => {
		const handleResize = () => {
			setIsShowSidebar(window.innerWidth <= 640);
		};
		handleResize();

		window.addEventListener("resize", handleResize);

		return () => {
			window.removeEventListener("resize", handleResize);
		};
	}, []);

	useEffect(() => {
		async function getAllMessages() {
			try {
				console.log(`*Fetching previous messages...`);
				const response = await fetch(
					"http://localhost:5000/api/messages",
					fetchOptions
				);
				const data = await response.json();
				setAllMessages(data);
			} catch (error) {
				console.error("Error fetching previous messages:", error);
			}
		}

		getAllMessages();
	}, []);

	return (
		<>
			<div className="container">
				<section className={`sidebar ${isShowSidebar ? "open" : ""}`}>
					<div
						className="sidebar-header"
						onClick={createNewChat}
						role="button"
					>
						<BiPlus size={20} />
						<button>New Chat</button>
					</div>
					<div className="sidebar-history">
						{messagesTodayUniqueTitles.length > 0 && (
							<>
								<p>Today</p>
								<ul>
									{messagesTodayUniqueTitles?.map(
										(uniqueTitle: any) => {
											return (
												<li
													key={uniqueTitle}
													onClick={() =>
														handleTitleClick(
															uniqueTitle
														)
													}
													className={`App_Unique_Title ${
														uniqueTitle ===
														currentTitle
															? "active"
															: ""
													}`}
												>
													{uniqueTitle}
												</li>
											);
										}
									)}
								</ul>
							</>
						)}
						{messagesNotTodayUniqueTitles.length > 0 && (
							<>
								<p>Previous</p>
								<ul>
									{messagesNotTodayUniqueTitles?.map(
										(uniqueTitle: any, idx) => {
											return (
												<li
													key={idx}
													onClick={() =>
														handleTitleClick(
															uniqueTitle
														)
													}
													className={`App_Unique_Title ${
														uniqueTitle ===
														currentTitle
															? "active"
															: ""
													}`}
												>
													{uniqueTitle}
												</li>
											);
										}
									)}
								</ul>
							</>
						)}
					</div>
					<div className="sidebar-info">
						<div className="sidebar-info-upgrade">
							<BiUser size={20} />
							<p>Upgrade plan</p>
						</div>
						<div className="sidebar-info-user">
							<BiSolidUserCircle size={20} />
							<p>User</p>
						</div>
					</div>
				</section>

				<section className="main">
					{!currentTitle && (
						<div className="empty-chat-container">
							<img
								src="pokeball.png"
								width={45}
								height={45}
								alt="ChatGPT"
							/>
							<h1>Pokemon Assistant</h1>
							<h3>Ask my anything about Pokemon</h3>
						</div>
					)}

					{isShowSidebar ? (
						<MdOutlineArrowRight
							className="burger"
							size={28.8}
							onClick={toggleSidebar}
						/>
					) : (
						<MdOutlineArrowLeft
							className="burger"
							size={28.8}
							onClick={toggleSidebar}
						/>
					)}
					<div className="main-header">
						<ul>
							{currentMessages?.map((chatMsg: any) => {
								const isUser = chatMsg.role === "user";
								return (
									<li key={chatMsg.id} ref={scrollToLastItem}>
										{isUser ? (
											<div>
												<BiSolidUserCircle
													size={28.8}
												/>
											</div>
										) : (
											<img
												className="avatar"
												src="pokeball.png"
												alt="ChatGPT"
											/>
										)}
										{isUser ? (
											<div>
												<p className="role-title">
													You
												</p>
												<p>{chatMsg.content}</p>
											</div>
										) : (
											<div>
												<p className="role-title">
													Pokemon Assistant
												</p>
												<p>
													{chatMsg.toolName ===
														"getPokemonImage" &&
													!chatMsg.errorMessage ? (
														<img
															src={
																JSON.parse(
																	chatMsg.content
																).pokemonImage
															}
															alt="Pokemon"
															width={300}
															height={300}
														/>
													) : (
														chatMsg.content
															?.split("\n")
															.map(
																(
																	line: any,
																	index: any
																) => (
																	<>
																		{line}
																		<br />
																	</>
																)
															)
													)}
												</p>
											</div>
										)}
									</li>
								);
							})}
						</ul>
					</div>
					<div className="main-bottom">
						{errorText && <p className="errorText">{errorText}</p>}
						{errorText && (
							<p id="errorTextHint">
								*You can clone the repository and use your paid
								OpenAI API key to make this work.
							</p>
						)}
						<form
							className="form-container"
							onSubmit={submitHandler}
						>
							<input
								type="text"
								placeholder="Send a message."
								spellCheck="false"
								value={
									isResponseLoading ? "Processing..." : text
								}
								onChange={(e) => setText(e.target.value)}
								readOnly={isResponseLoading}
							/>
							{!isResponseLoading && (
								<button type="submit">
									<BiSend size={20} />
								</button>
							)}
						</form>
						<p>
							ChatGPT can make mistakes. Consider checking
							important information.
						</p>
					</div>
				</section>
			</div>
		</>
	);
}

export default App;
