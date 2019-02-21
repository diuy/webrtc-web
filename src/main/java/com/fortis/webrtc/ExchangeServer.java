package com.fortis.webrtc;


import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.websocket.*;
import javax.websocket.server.ServerEndpoint;
import java.io.IOException;
import java.util.Set;
import java.util.concurrent.CopyOnWriteArraySet;

@ServerEndpoint("/exchange")
public class ExchangeServer {
    static final Logger logger = LoggerFactory.getLogger(ExchangeServer.class);
    private static Set<Session> sessions = new CopyOnWriteArraySet<>();

    @OnOpen
    public void onOpen(Session session) {
        //logger.error("*************");
        System.out.println("open:" + session.getId());
        sessions.add(session);
    }

    @OnClose
    public void onClose(Session session, CloseReason closeReason) {
        System.out.println("close:" + session.getId() + "," + closeReason.toString());
        sessions.remove(session);
    }

    @OnMessage
    public void onMessage(String message, Session session) {
        //   System.out.println("message:" + session.getId() + "\n" + message);
        System.out.println("message:" + session.getId());

        for (Session s : sessions) {
            if (s != session) {
                try {
                    s.getBasicRemote().sendText(message);
                    System.out.println("send to :" + s.getId());
                } catch (IOException e) {
                    System.out.println("send to :" + s.getId() + ",failed");
                }
            }
        }
    }

    @OnError
    public void onError(Throwable throwable, Session session) {
        System.out.println("error:" + session.getId() + "," + throwable.getMessage());
        //sessions.remove(session);
    }
}
