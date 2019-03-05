package com.fortis.webrtc;

import io.netty.buffer.ByteBuf;
import io.netty.channel.ChannelHandlerContext;
import io.netty.handler.codec.ByteToMessageCodec;

import java.util.List;

public class TcpStringCodec extends ByteToMessageCodec<String> {
    @Override
    protected void encode(ChannelHandlerContext ctx, String msg, ByteBuf out) throws Exception {

        byte[] data = msg.getBytes("UTF-8");
        out.writeInt(data.length);
        out.writeBytes(data);
        System.out.println("encode len:"+
                data.length);
    }

    @Override
    protected void decode(ChannelHandlerContext ctx, ByteBuf in, List<Object> out) throws Exception {
        if (in.readableBytes() < 4)
            return;

        int index = in.readerIndex();
        int length = in.readInt();
        if (length <= 0 || length > 1024 * 1024)
            return;

        if (in.readableBytes() >= length) {
            byte[] data = new byte[length];
            in.readBytes(data);
            String str = new String(data, "UTF-8");
            out.add(str);
        } else {
            in.readerIndex(index);
        }
    }
}
