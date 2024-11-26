import {
  useState,
  useEffect,
  useRef,
  useCallback,
  useLayoutEffect,
} from 'react'
import { BiPlus, BiUser, BiSend, BiSolidUserCircle } from 'react-icons/bi'
import { MdOutlineArrowLeft, MdOutlineArrowRight } from 'react-icons/md'

const serverUrl =
  process.env.NODE_ENV === 'development'
    ? 'http://localhost:8080'
    : 'https://pokemon4-0770c86f5a12.herokuapp.com' // TODO
console.log(`*Example serverUrl: `, serverUrl)

const fetchOptions = {
  headers: {
    'Content-Type': 'application/json',
    Authorization: 'Bearer andrewcbuensalida',
  },
}

function App() {
  const [text, setText] = useState<any>('')
  const [allMessages, setAllMessages] = useState<any>([])
  const [currentTitle, setCurrentTitle] = useState<any>(null)
  const [isResponseLoading, setIsResponseLoading] = useState<any>(false)
  const [errorText, setErrorText] = useState<any>('')
  const [isShowSidebar, setIsShowSidebar] = useState<any>(false)
  const scrollToLastItem = useRef<any>(null)
  const inputRef = useRef<any>(null)

  const currentMessages = allMessages.filter(
    (msg: any) => msg.title === currentTitle
  )
  const messagesToday = allMessages.filter(
    (msg: any) =>
      new Date(msg.createdAt).toDateString() === new Date().toDateString()
  )
  const messagesTodayUniqueTitles = Array.from(
    new Set(messagesToday.map((msg: any) => msg.title))
  ).reverse()

  const messagesNotTodayUniqueTitles = Array.from(
    new Set(
      allMessages
        .map((msg: any) => msg.title)
        .filter((title: any) => !messagesTodayUniqueTitles.includes(title))
    )
  ).reverse()

  const createNewChat = () => {
    setText('')
    setCurrentTitle(null)
    inputRef.current?.focus()
  }

  const handleTitleClick = (uniqueTitle: any) => {
    setCurrentTitle(uniqueTitle)
    setText('')
    inputRef.current?.focus()
  }

  const toggleSidebar = useCallback(() => {
    setIsShowSidebar((prev: any) => !prev)
  }, [])

  const submitHandler = async (e: any) => {
    e.preventDefault()

    if (!text) return

    // temporarily add the message to the list. This will be replaced by the actual response since setAllMessages below uses an outdated allMessages state.
    setAllMessages([
      ...allMessages,
      {
        id: Math.random().toString(36).substr(2, 9),
        title: currentTitle || text,
        role: 'user',
        content: text,
        createdAt: new Date().toISOString(),
        userId: '1',
      },
    ])

    setCurrentTitle(currentTitle || text)

    setTimeout(() => {
      scrollToLastItem.current?.lastElementChild?.scrollIntoView({
        behavior: 'smooth',
      })
    }, 1)
    setIsResponseLoading(true)
    setErrorText('')

    try {
      const response = await fetch(`${serverUrl}/api/completions`, {
        ...fetchOptions,
        method: 'POST',
        body: JSON.stringify({
          message: text,
          title: currentTitle,
        }),
      })

      if (response.status === 429) {
        return setErrorText('Too many requests, please try again later.')
      }

      const data = await response.json()

      if (data.error) {
        setErrorText(data.error.message)
        setText('')
      } else {
        setErrorText('')
      }

      if (!data.error) {
        setErrorText('')
        setTimeout(() => {
          scrollToLastItem.current?.lastElementChild?.scrollIntoView({
            behavior: 'smooth',
          })
        }, 1)
        setTimeout(() => {
          setText('')
        }, 2)
        setAllMessages([...allMessages, ...data.newMessages])
        setCurrentTitle(data.newMessages[0].title)
      }
    } catch (e: any) {
      setErrorText('Error sending message. Please try again later.')
      console.error(e)
    } finally {
      setIsResponseLoading(false)
    }
  }

  useLayoutEffect(() => {
    const handleResize = () => {
      setIsShowSidebar(window.innerWidth <= 640)
    }
    handleResize()

    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    async function getAllMessages() {
      try {
        console.log(`*Fetching previous messages...`)
        const response = await fetch(`${serverUrl}/api/messages`, fetchOptions)
        const data = await response.json()
        setAllMessages(data)
      } catch (error) {
        console.error('Error fetching previous messages:', error)
      }
    }

    getAllMessages()
  }, [])

  return (
    <>
      <div className="container">
        <section className={`sidebar ${isShowSidebar ? 'open' : ''}`}>
          <div className="sidebar-header" onClick={createNewChat} role="button">
            <BiPlus size={20} />
            <button>New Chat</button>
          </div>
          <div className="sidebar-history">
            {messagesTodayUniqueTitles.length > 0 && (
              <>
                <p>Today</p>
                <ul>
                  {messagesTodayUniqueTitles?.map((uniqueTitle: any) => {
                    return (
                      <li
                        key={uniqueTitle}
                        onClick={() => handleTitleClick(uniqueTitle)}
                        className={`App_Unique_Title ${
                          uniqueTitle === currentTitle ? 'active' : ''
                        }`}
                      >
                        {uniqueTitle}
                      </li>
                    )
                  })}
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
                          onClick={() => handleTitleClick(uniqueTitle)}
                          className={`App_Unique_Title ${
                            uniqueTitle === currentTitle ? 'active' : ''
                          }`}
                        >
                          {uniqueTitle}
                        </li>
                      )
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
              <img src="pokeball.png" width={45} height={45} alt="ChatGPT" />
              <h1>Pokemon Assistant</h1>
              <h3>
                Say 'show me Pikachu'
                <br />
                Say 'picture of 151st pokemon'
                <br />
                Say 'Pokemon events in San Diego'
                <br />
                Say 'What are Charizards attacks?'
                <br />
                or ask me anything about Pokemon
              </h3>
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
                const isUser = chatMsg.role === 'user'
                return (
                  <li key={chatMsg.id} ref={scrollToLastItem}>
                    {isUser ? (
                      <div>
                        <BiSolidUserCircle size={28.8} />
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
                        <p className="role-title">You</p>
                        <p>{chatMsg.content}</p>
                      </div>
                    ) : (
                      <div>
                        <p className="role-title">Pokemon Assistant</p>
                        <p>
                          {chatMsg.toolName === 'getPokemonImage' &&
                          !chatMsg.errorMessage ? (
                            <img
                              src={JSON.parse(chatMsg.content).pokemonImage}
                              alt="Pokemon"
                              width={300}
                              height={300}
                            />
                          ) : (
                            chatMsg.content
                              ?.split('\n')
                              .map((line: any, index: any) => (
                                <>
                                  {line}
                                  <br />
                                </>
                              ))
                          )}
                        </p>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          </div>
          <div className="main-bottom">
            {errorText && <p className="errorText">{errorText}</p>}
            <form className="form-container" onSubmit={submitHandler}>
              <input
                ref={inputRef}
                type="text"
                placeholder="Send a message."
                spellCheck="false"
                value={isResponseLoading ? 'Processing...' : text}
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
              ChatGPT can make mistakes. Consider checking important
              information.
            </p>
          </div>
        </section>
      </div>
    </>
  )
}

export default App
