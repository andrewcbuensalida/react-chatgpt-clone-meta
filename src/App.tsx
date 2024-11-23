import {
	useState,
	useEffect,
	useRef,
	useCallback,
	useLayoutEffect,
} from "react";
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from "react-icons/bi";
import { MdOutlineArrowLeft, MdOutlineArrowRight } from "react-icons/md";

function App() {
	const [text, setText] = useState<any>("");
	const [message, setMessage] = useState<any>(null);
	const [previousChats, setPreviousChats] = useState<any>([]);
	const [localChats, setLocalChats] = useState<any>([]);
	const [currentTitle, setCurrentTitle] = useState<any>(null);
	const [isResponseLoading, setIsResponseLoading] = useState<any>(false);
	const [errorText, setErrorText] = useState<any>("");
	const [isShowSidebar, setIsShowSidebar] = useState<any>(false);
	const scrollToLastItem = useRef<any>(null);

	const createNewChat = () => {
		setMessage(null);
		setText("");
		setCurrentTitle(null);
	};

	const backToHistoryPrompt = (uniqueTitle:any) => {
		setCurrentTitle(uniqueTitle);
		setMessage(null);
		setText("");
	};

	const toggleSidebar = useCallback(() => {
		setIsShowSidebar((prev:any) => !prev);
	}, []);

	const submitHandler = async (e:any) => {
		e.preventDefault();

		if (!text) return;

		setIsResponseLoading(true);
		setErrorText("");

		const options = {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Authorization: 'Bearer andrewcbuensalida',
			},
			body: JSON.stringify({
				message: text,
			}),
		};

		try {
			const response = await fetch(
				`http://localhost:5000/api/completions`,
				options
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
				setErrorText('');
			}

			if (!data.error) {
				setErrorText("");
				setMessage(data.choices[0].message);
				setTimeout(() => {
					scrollToLastItem.current?.lastElementChild?.scrollIntoView({
						behavior: "smooth",
					});
				}, 1);
				setTimeout(() => {
					setText("");
				}, 2);
			}
		} catch (e:any) {
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
		const storedChats = localStorage.getItem("previousChats");

		if (storedChats) {
			setLocalChats(JSON.parse(storedChats));
		}
	}, []);

	useEffect(() => {
		if (!currentTitle && text && message) {
			setCurrentTitle(text);
		}

		if (currentTitle && text && message) {
			const newChat = {
				title: currentTitle,
				role: "user",
				content: text,
			};

			const responseMessage = {
				title: currentTitle,
				role: message.role,
				content: message.content,
			};

			setPreviousChats((prevChats:any) => [
				...prevChats,
				newChat,
				responseMessage,
			]);
			setLocalChats((prevChats: any) => [
				...prevChats,
				newChat,
				responseMessage,
			]);

			const updatedChats = [...localChats, newChat, responseMessage];
			localStorage.setItem("previousChats", JSON.stringify(updatedChats));
		}
	}, [message, currentTitle]);

	const currentChat = (localChats || previousChats).filter(
		(prevChat: any) => prevChat.title === currentTitle
	);

	const uniqueTitles = Array.from(
		new Set(previousChats.map((prevChat: any) => prevChat.title).reverse())
	);

	const localUniqueTitles = Array.from(
		new Set(localChats.map((prevChat: any) => prevChat.title).reverse())
	).filter((title) => !uniqueTitles.includes(title));

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
						{uniqueTitles.length > 0 &&
							previousChats.length !== 0 && (
								<>
									<p>Ongoing</p>
									<ul>
										{uniqueTitles?.map(
											(uniqueTitle: any, idx: number) => {
												const listItems =
													document.querySelectorAll(
														"li"
													);

												listItems.forEach((item) => {
													if (
														item.scrollWidth >
														item.clientWidth
													) {
														item.classList.add(
															"li-overflow-shadow"
														);
													}
												});

												return (
													<li
														key={idx}
														onClick={() =>
															backToHistoryPrompt(
																uniqueTitle
															)
														}
													>
														{uniqueTitle}
													</li>
												);
											}
										)}
									</ul>
								</>
							)}
						{localUniqueTitles.length > 0 &&
							localChats.length !== 0 && (
								<>
									<p>Previous</p>
									<ul>
										{localUniqueTitles?.map(
											(uniqueTitle: any, idx) => {
												const listItems =
													document.querySelectorAll(
														"li"
													);

												listItems.forEach((item) => {
													if (
														item.scrollWidth >
														item.clientWidth
													) {
														item.classList.add(
															"li-overflow-shadow"
														);
													}
												});

												return (
													<li
														key={idx}
														onClick={() =>
															backToHistoryPrompt(
																uniqueTitle
															)
														}
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
							{currentChat?.map((chatMsg: any, idx: any) => {
								const isUser = chatMsg.role === "user";

								return (
									<li key={idx} ref={scrollToLastItem}>
										{isUser ? (
											<div>
												<BiSolidUserCircle
													size={28.8}
												/>
											</div>
										) : (
											<img
												src="images/chatgpt-logo.svg"
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
													ChatGPT
												</p>
												<p>{chatMsg.content}</p>
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
